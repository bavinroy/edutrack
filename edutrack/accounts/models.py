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
    category = models.CharField(max_length=5, choices=CATEGORY_CHOICES, default="UG")

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"

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
    course = models.CharField(max_length=100)
    year = models.IntegerField(null=True, blank=True)
    date_joined = models.DateField(auto_now_add=True)  # ✅ auto-fill on creation

    def __str__(self):
        return f"{self.roll_no} - {self.user.username}"
    
    # Department moved to top


class Subject(models.Model):
    name = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='subjects')

    def __str__(self):
        return f"{self.name} ({self.department.name})"

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
    admin_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    staff_comment = models.TextField(blank=True, null=True)
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