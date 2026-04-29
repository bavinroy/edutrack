from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.conf import settings
from django.utils import timezone
from Staff_profile.models import StaffProfile
# JSONField for Django >= 3.1 (Postgres or built-in)
try:
    from django.db.models import JSONField  # Django 3.1+
except ImportError:
    from django.contrib.postgres.fields import JSONField  # fallback for older versions


class Department(models.Model):
    CATEGORY_CHOICES = [
        ("UG", "Under Graduate"),
        ("PG", "Post Graduate"),
    ]
    name = models.CharField(max_length=100)
    branch = models.CharField(max_length=100)
    category = models.CharField(max_length=5, choices=CATEGORY_CHOICES, default="UG")
    hod = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="hod_department")

    def __str__(self):
        return f"{self.name} - {self.branch}"

class Subject(models.Model):
    TYPE_CHOICES = [
        ("Theory", "Theory"),
        ("Practical", "Practical"),
        ("Project", "Project"),
        ("SoftSkill", "Soft Skill"),
    ]
    CATEGORY_CHOICES = [
        ("Core", "Core"),
        ("Elective", "Elective"),
        ("Mandatory", "Mandatory"),
    ]

    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True, null=True, blank=True)
    alias = models.CharField(max_length=50, blank=True, null=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='subjects')
    semester = models.IntegerField(default=1)
    year = models.IntegerField(default=1)
    transcript_credits = models.IntegerField(default=3)
    subject_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="Theory")
    subject_category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="Core")
    regulation = models.CharField(max_length=20, default="R2021")
    evaluation_scheme = JSONField(default=dict, help_text="{'internal': 40, 'external': 60}")
    
    def __str__(self):
        return f"{self.name} ({self.code})"

class TimeTable(models.Model):
    """
    A flexible timetable container. `grid` holds the table data as JSON.
    Example grid format:
    {
      "periods": ["09:00-09:50","10:00-10:50",...],
      "rows": [
         { "day": "Monday", "cells": ["Math","Physics","---", ...] },
         { "day": "Tuesday", "cells": ["Chem","CS","Lab", ...] },
         ...
      ],
      "meta": { "class": "IV CSE", "section": "A", "notes": "Exam week exceptions..." }
    }
    """
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("pending_verification", "Pending Verification"),
        ("published", "Published"),
        ("rejected", "Rejected"),
    ]

    title = models.CharField(max_length=200, blank=True)
    class_name = models.CharField(max_length=100, blank=True)
    section = models.CharField(max_length=50, blank=True)
    year = models.CharField(max_length=20, blank=True)
    grid = JSONField(default=dict)
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="created_timetables")
    department = models.ForeignKey('Department', on_delete=models.CASCADE, related_name="timetables", null=True, blank=True)
    
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default="draft")
    verified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="verified_timetables")
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        meta_name = self.title or f"{self.class_name} {self.section}".strip()
        return f"Timetable: {meta_name} ({self.pk})"

class ScheduleEntry(models.Model):
    DAY_CHOICES = [
        ("Monday", "Monday"),
        ("Tuesday", "Tuesday"),
        ("Wednesday", "Wednesday"),
        ("Thursday", "Thursday"),
        ("Friday", "Friday"),
        ("Saturday", "Saturday"),
        ("Sunday", "Sunday"),
    ]

    timetable = models.ForeignKey(TimeTable, on_delete=models.CASCADE, related_name="entries")
    day = models.CharField(max_length=15, choices=DAY_CHOICES)
    period_number = models.IntegerField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True)
    staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="schedule_entries")
    
    is_break = models.BooleanField(default=False)
    break_name = models.CharField(max_length=50, blank=True, null=True) # e.g., "Lunch"

    class Meta:
        ordering = ["day", "period_number"]
        unique_together = [("timetable", "day", "period_number")] # One entry per slot per timetable

    def __str__(self):
        return f"{self.timetable} - {self.day} P{self.period_number}"

class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, username, email=None, password=None, **extra_fields):
        if not username:
            raise ValueError("The Username must be set")
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", User.Roles.SUPER_ADMIN)  # 👈 Superuser always Super Admin

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(username, email, password, **extra_fields)

class User(AbstractUser):
    class Roles(models.TextChoices):
        SUPER_ADMIN = "SUPER_ADMIN", "Super Admin"
        PRINCIPAL = "PRINCIPAL", "Principal"
        DEPT_ADMIN = "DEPT_ADMIN", "Dept Admin"
        DEPT_STAFF = "DEPT_STAFF", "Dept Staff"
        DEPT_STUDENT = "DEPT_STUDENT", "Dept Student"

    role = models.CharField(
        max_length=20,
        choices=Roles.choices,
        default=Roles.DEPT_STUDENT
    )

    # Field to store the non-unique "Username" desired by the user
    display_name = models.CharField(max_length=150, blank=True, null=True, verbose_name="Display Name")
    
    # Link every user to a department directly for RBAC
    department = models.ForeignKey(
        'Department', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="users"
    )

    def is_admin(self):
        return self.role in [self.Roles.SUPER_ADMIN, self.Roles.PRINCIPAL, self.Roles.DEPT_ADMIN]

    def is_staff_member(self):
        return self.role in [self.Roles.DEPT_STAFF, self.Roles.DEPT_ADMIN]

    def is_student(self):
        return self.role == self.Roles.DEPT_STUDENT
    
    @property
    def is_super_admin(self):
        return self.role == self.Roles.SUPER_ADMIN

    @property
    def is_principal(self):
        return self.role == self.Roles.PRINCIPAL

    @property
    def is_dept_admin(self):
        return self.role == self.Roles.DEPT_ADMIN

    @property
    def is_dept_staff(self):
        return self.role == self.Roles.DEPT_STAFF

    objects = UserManager()

    def save(self, *args, **kwargs):
        # Auto-grant permissions based on role
        if self.role == self.Roles.SUPER_ADMIN:
             self.is_staff = True
             self.is_superuser = True
        elif self.role == self.Roles.PRINCIPAL:
             self.is_staff = True
             self.is_superuser = True # Assume Principal needs full access for now, or refine if asked
        elif self.role == self.Roles.DEPT_ADMIN:
             self.is_staff = True
             self.is_superuser = False # <--- RESTRICTED
        elif self.role == self.Roles.DEPT_STAFF:
             self.is_staff = True # Allow login to Admin
             self.is_superuser = False
        
        super().save(*args, **kwargs)






class Student(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="student_account", null= True, blank= True
    )
    roll_no = models.CharField(max_length=20, unique=True)
    register_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    avatar = models.ImageField(upload_to="avatars/students/", null=True, blank=True)
    
    # Personal Details
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, null=True, blank=True)
    blood_group = models.CharField(max_length=5, null=True, blank=True)
    aadhaar_number = models.CharField(max_length=12, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    mobile_number = models.CharField(max_length=15, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    community = models.CharField(max_length=50, null=True, blank=True)
    caste = models.CharField(max_length=50, null=True, blank=True)
    religion = models.CharField(max_length=50, null=True, blank=True)
    nationality = models.CharField(max_length=50, default="Indian")

    # Parent Details
    father_name = models.CharField(max_length=100, null=True, blank=True)
    mother_name = models.CharField(max_length=100, null=True, blank=True)
    guardian_name = models.CharField(max_length=100, null=True, blank=True)
    parent_contact = models.CharField(max_length=15, null=True, blank=True)

    # Academic Details
    course = models.CharField(max_length=100) # e.g. B.E. CSE
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, related_name="students")
    year = models.IntegerField(null=True, blank=True)
    semester = models.IntegerField(null=True, blank=True)
    section = models.CharField(max_length=10, null=True, blank=True)
    batch = models.CharField(max_length=20, null=True, blank=True) # e.g. 2022-2026
    
    date_joined = models.DateField(auto_now_add=True)
    admission_number = models.CharField(max_length=20, null=True, blank=True)
    scholar_type = models.CharField(max_length=20, null=True, blank=True)

    # Previous Education
    tenth_marks = models.FloatField(null=True, blank=True) # Percentage
    twelfth_marks = models.FloatField(null=True, blank=True)
    diploma_marks = models.FloatField(null=True, blank=True)
    current_cgpa = models.FloatField(default=0.0)

    # Academic Status
    ACADEMIC_STATUS_CHOICES = [
        ("Studying", "Studying"),
        ("Discontinued", "Discontinued"),
    ]
    academic_status = models.CharField(max_length=20, choices=ACADEMIC_STATUS_CHOICES, default="Studying")

    def __str__(self):
        return f"{self.roll_no} - {self.user.username if self.user else 'No User'}"


class AttendanceSession(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    date = models.DateField(default=timezone.now)
    start_time = models.TimeField()
    end_time = models.TimeField()
    year = models.IntegerField()
    semester = models.IntegerField()
    section = models.CharField(max_length=10)
    
    # New fields to match college system
    hour = models.CharField(max_length=50, blank=True, null=True) # e.g. "1", "2", "3,4", "Extra"
    mode_of_hour = models.CharField(max_length=50, blank=True, null=True) # Course, Library, Mentor...
    class_mode = models.CharField(max_length=50, blank=True, null=True) # Lecture, Tutorial...
    unit_number = models.CharField(max_length=50, blank=True, null=True)
    mode_of_teaching = models.CharField(max_length=50, blank=True, null=True)
    topics_covered = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.subject.code} - {self.date} ({self.section})"

class AttendanceRecord(models.Model):
    STATUS_CHOICES = [
        ("Present", "Present"),
        ("Absent", "Absent"),
        ("OnDuty", "On Duty"),
        ("Late", "Late"),
    ]
    session = models.ForeignKey(AttendanceSession, on_delete=models.CASCADE, related_name="records")
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="attendance_records")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="Present")
    remarks = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        unique_together = ('session', 'student')

class ClassAdvisor(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='class_advisors')
    year = models.IntegerField()
    section = models.CharField(max_length=10, default="A")
    advisor1 = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='advisor1_classes', on_delete=models.SET_NULL, null=True, blank=True)
    advisor2 = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='advisor2_classes', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        unique_together = ('department', 'year', 'section')

    def __str__(self):
        return f"{self.department.name} - Year {self.year} ({self.section})"

class Document(models.Model):
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="documents")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    subject_name = models.CharField(max_length=255)
    subject_code = models.CharField(max_length=50)
    staff_name = models.CharField(max_length=255)
    file = models.FileField(upload_to="documents/")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.subject_code} - {self.title}"




class Letter(models.Model):
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="letters"
    )
    title = models.CharField(max_length=255)
    content = models.TextField()
    is_shared = models.BooleanField(default=False)  # if True → visible to all students
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.owner})"


class Request(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    letter = models.ForeignKey(Letter, on_delete=models.CASCADE, related_name="requests")
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="student_requests")
    staff = models.ForeignKey(
        StaffProfile,  # use the StaffProfile model
    on_delete=models.CASCADE,
    related_name="assigned_requests", null=True, blank=True
    )
    staff_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    staff_comment = models.TextField(blank=True, null=True)
    
    admin_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    admin_comment = models.TextField(blank=True, null=True)

    principal_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    principal_comment = models.TextField(blank=True, null=True)

    rejection_reason = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.letter.title} - {self.student.username}"


class UserCreationRequest(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user_creation_requests")
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name="user_creation_requests")
    file = models.FileField(upload_to="user_creation_requests/")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    admin_comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Request by {self.uploaded_by.username} ({self.status})"

    principal_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    principal_comment = models.TextField(blank=True, null=True)

    rejection_reason = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def is_fully_approved(self):
        return self.staff_status == "approved" and self.admin_status == "approved"

    def __str__(self):
        return f"Request {self.id} - {self.letter.title}"


class RequestHistory(models.Model):
    request = models.ForeignKey(Request, on_delete=models.CASCADE, related_name="history")
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=50)  # approved / rejected / submitted
    status = models.CharField(max_length=20, choices=Request.STATUS_CHOICES)
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.user} {self.action} at {self.timestamp}"
    

class Notice(models.Model):
    NOTICE_TYPE_CHOICES = [
        ("text", "Text"),
        ("image", "Image"),
        ("video", "Video"),
        ("mixed", "Mixed"),  # text + image/video
    ]

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notices", null=True, blank=True
    )
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True, null=True)
    notice_type = models.CharField(max_length=20, choices=NOTICE_TYPE_CHOICES, default="text")
    image = models.ImageField(upload_to="notice_images/", blank=True, null=True)
    video = models.FileField(upload_to="notice_videos/", blank=True, null=True)
    
    # Audience Targeting
    target_dept_admin = models.BooleanField(default=False)
    target_staff = models.BooleanField(default=False)
    target_student = models.BooleanField(default=True) # Default to students? Or all False.
    target_department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="department_notices")
    
    views = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
    

class NoticeAcknowledgement(models.Model):
    notice = models.ForeignKey("Notice", on_delete=models.CASCADE, related_name="acknowledgements")
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="acknowledged_notices")
    acknowledged_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("notice", "student")  # prevent multiple acknowledges

    def __str__(self):
        return f"{self.student.username} acknowledged {self.notice.title}"


class NoticeComment(models.Model):
    notice = models.ForeignKey("Notice", on_delete=models.CASCADE, related_name="comments")
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notice_comments")
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.student.username} on {self.notice.title}"

class AccountRequest(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]
    full_name = models.CharField(max_length=150)
    register_number = models.CharField(max_length=50)
    year = models.IntegerField()
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name="account_requests")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    resolution_note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.register_number} - {self.full_name}"


class Notification(models.Model):
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    target_url = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.recipient.username}"

class PushDevice(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="push_device")
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.token}"

class PasswordResetOTP(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="password_reset_otps")
    otp = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_expired(self):
        from django.utils import timezone
        import datetime
        expiration_time = self.created_at + datetime.timedelta(minutes=15)
        return timezone.now() > expiration_time

    def __str__(self):
        return f"OTP for {self.user.username} - {'Used' if self.is_used else 'Active'}"