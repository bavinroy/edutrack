
# accounts/serializers.py
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from accounts.models import (
    User, Student, Department, Subject, Document, TimeTable, 
    Letter, Request, RequestHistory, Notice, NoticeAcknowledgement, NoticeComment, 
    ClassAdvisor, AccountRequest, UserCreationRequest, AttendanceSession, AttendanceRecord,
    ScheduleEntry, Notification
)

# --- User Serializers ---
class SimpleUserSerializer(serializers.ModelSerializer):
    """
    Minimal user serializer used when we only need username / id in nested responses.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    avatar_url = serializers.SerializerMethodField()
    student_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "role", "first_name", "last_name", "avatar_url", "student_id"]

    def get_student_id(self, obj):
        if hasattr(obj, "student_account") and obj.student_account:
            return obj.student_account.id
        return None

    def get_avatar_url(self, obj):
        request = self.context.get("request")
        avatar_path = None
        
        # Priority 1: Check Staff Profile
        if hasattr(obj, "staff_profile") and obj.staff_profile and obj.staff_profile.avatar:
            avatar_path = obj.staff_profile.avatar.url
        
        # Priority 2: Check Student Account
        if not avatar_path and hasattr(obj, "student_account") and obj.student_account and obj.student_account.avatar:
            avatar_path = obj.student_account.avatar.url

        # Priority 3: Check Admin Profile (if exists)
        if not avatar_path and hasattr(obj, "admin_profile") and obj.admin_profile and obj.admin_profile.avatar:
            avatar_path = obj.admin_profile.avatar.url

        # Priority 4: Check Student Profile (Fallback)
        if not avatar_path and hasattr(obj, "student_profile") and obj.student_profile and obj.student_profile.avatar:
            avatar_path = obj.student_profile.avatar.url

        if avatar_path and request:
            return request.build_absolute_uri(avatar_path)
        return avatar_path

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class UserCreateSerializer(serializers.ModelSerializer):
    """
    Specialized serializer for admin-created users with department link.
    """
    year = serializers.IntegerField(required=False, allow_null=True)
    # Student specific fields
    semester = serializers.IntegerField(required=False, allow_null=True)
    section = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    register_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    course = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    mobile_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    dob = serializers.DateField(required=False, allow_null=True)
    gender = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    blood_group = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    aadhaar_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    father_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    mother_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    parent_contact = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    tenth_marks = serializers.FloatField(required=False, allow_null=True)
    twelfth_marks = serializers.FloatField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "password", "department_id", "role", "year",
            "first_name", "last_name", "semester", "section", "register_number",
            "course", "mobile_number", "dob", "gender", "blood_group",
            "aadhaar_number", "address", "father_name", "mother_name",
            "parent_contact", "tenth_marks", "twelfth_marks"
        ]

    def validate(self, data):
        if data.get('role') == User.Roles.DEPT_STUDENT:
             if not data.get('year'):
                 raise serializers.ValidationError({"year": "Year is required for students."})
             if not data.get('first_name'):
                 raise serializers.ValidationError({"first_name": "First Name is required for students."})
             if not data.get('last_name'):
                 raise serializers.ValidationError({"last_name": "Last Name is required for students."})
             
             request = self.context.get('request')
             if request and request.user.role in [User.Roles.SUPER_ADMIN, User.Roles.PRINCIPAL]:
                 if not data.get('department_id'):
                     raise serializers.ValidationError({"department_id": "Department is required for students created by Admins."})
        return data

    def create(self, validated_data):
        password = validated_data.pop("password")
        
        # Extract student specific fields
        student_fields = [
            "year", "semester", "section", "register_number", "course",
            "mobile_number", "dob", "gender", "blood_group", "aadhaar_number",
            "address", "father_name", "mother_name", "parent_contact",
            "tenth_marks", "twelfth_marks"
        ]
        student_data = {field: validated_data.pop(field, None) for field in student_fields}
        
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        
        # If student, create Student entry
        if user.role == User.Roles.DEPT_STUDENT:
             user.refresh_from_db()  # Ensure department and other DB-defaulted fields are synced
             Student.objects.create(
                 user=user,
                 roll_no=user.username,
                 department=user.department,
                 **student_data
             )
        # If staff or dept admin, create StaffProfile entry
        elif user.role in [User.Roles.DEPT_STAFF, User.Roles.DEPT_ADMIN]:
             from Staff_profile.models import StaffProfile
             StaffProfile.objects.create(
                 user=user,
                 department=user.department.name if user.department else "General",
                 designation="HOD" if user.role == User.Roles.DEPT_ADMIN else "Staff"
             )
        
        return user

class BulkUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    role = serializers.ChoiceField(choices=User.Roles.choices, required=False) 

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["role"] = self.user.role
        data["username"] = self.user.username
        return data

# --- Student ---


# --- Student ---

class StudentSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)
    department_name = serializers.SerializerMethodField()
    first_name = serializers.CharField(source="user.first_name", required=False)
    last_name = serializers.CharField(source="user.last_name", required=False)
    email = serializers.EmailField(source="user.email", required=False)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id', 'user', 'roll_no', 'register_number', 'avatar', 'avatar_url',
            'year', 'semester', 'section', 'course', 'mobile_number', 'dob',
            'gender', 'blood_group', 'aadhaar_number', 'email', 'address',
            'first_name', 'last_name',
            'community', 'caste', 'religion', 'nationality', 'father_name',
            'mother_name', 'parent_contact', 'tenth_marks', 'twelfth_marks',
            'academic_status', 'department', 'department_name'
        ]

    def get_department_name(self, obj):
        return obj.department.name if obj.department else None

    def get_avatar_url(self, obj):
        request = self.context.get("request")
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        return None

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        if user_data and instance.user:
            for attr, value in user_data.items():
                setattr(instance.user, attr, value)
            instance.user.save()
        return super().update(instance, validated_data)

class ClassAdvisorSerializer(serializers.ModelSerializer):
    advisor1_name = serializers.StringRelatedField(source='advisor1', read_only=True)
    advisor2_name = serializers.StringRelatedField(source='advisor2', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    department = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = ClassAdvisor
        fields = ['id', 'department', 'department_name', 'year', 'section', 'advisor1', 'advisor1_name', 'advisor2', 'advisor2_name']

# --- Department & Subject ---

class DepartmentSerializer(serializers.ModelSerializer):
    hod_name = serializers.CharField(source="hod.username", read_only=True)
    class Meta:
        model = Department
        fields = ['id', 'name', 'branch', 'category', 'hod', 'hod_name']

class SubjectSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), source='department', write_only=True
    )

    class Meta:
        model = Subject
        fields = "__all__"

# --- Attendance ---

class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.username", read_only=True)
    roll_no = serializers.CharField(source="student.roll_no", read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = ['id', 'session', 'student', 'student_name', 'roll_no', 'status', 'remarks']

class AttendanceSessionSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    staff_name = serializers.CharField(source="staff.username", read_only=True)
    records = AttendanceRecordSerializer(many=True, read_only=True)

    class Meta:
        model = AttendanceSession
        fields = ['id', 'subject', 'subject_name', 'staff', 'staff_name', 'date', 'start_time', 'end_time', 
                  'year', 'semester', 'section', 'hour', 'mode_of_hour', 'class_mode', 'unit_number', 
                  'mode_of_teaching', 'topics_covered', 'records']

# --- Document ---

class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Document
        fields = "__all__"

# --- TimeTable ---

class ScheduleEntrySerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    staff_name = serializers.CharField(source='staff.username', read_only=True)

    class Meta:
        model = ScheduleEntry
        fields = [
            'id', 'day', 'period_number', 'start_time', 'end_time', 
            'subject', 'subject_name', 'subject_code', 
            'staff', 'staff_name', 
            'is_break', 'break_name'
        ]

class TimeTableSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)
    verified_by_name = serializers.CharField(source="verified_by.username", read_only=True)

    class Meta:
        model = TimeTable
        fields = [
            "id", "title", "class_name", "section", "year",
            "grid", "created_by", "created_at", "updated_at",
            "status", "department", "department_name", "verified_by", "verified_by_name"
        ]
        read_only_fields = ["created_by", "created_at", "updated_at", "verified_by"]

    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["created_by"] = request.user
            if request.user.department:
                validated_data["department"] = request.user.department
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop("created_by", None)
        # Prevent non-admins from manually verifying via simple update if strict security needed
        # but for now we rely on views for permission checks
        return super().update(instance, validated_data)

# --- Letter & Request ---

class LetterSerializer(serializers.ModelSerializer):
    owner = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Letter
        fields = "__all__"
        read_only_fields = ["owner", "created_at", "updated_at"]

class RequestHistorySerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()

    class Meta:
        model = RequestHistory
        fields = "__all__"

class RequestSerializer(serializers.ModelSerializer):
    letter = LetterSerializer(read_only=True)
    staff = serializers.StringRelatedField() 
    class Meta:
        model = Request
        fields = "__all__"
        read_only_fields = ["student", "staff_approved", "staff_approved_at", "admin_approved", "admin_approved_at"]

class RequestActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Request
        fields = ["staff_status", "staff_comment"]

class PrincipalActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Request
        fields = ["principal_status", "principal_comment"]

class AdminActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Request
        fields = ["admin_status", "admin_comment"]

class PrincipalActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Request
        fields = ["principal_status", "principal_comment"]

# --- Notices ---

class NoticeCommentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.username", read_only=True)

    class Meta:
        model = NoticeComment
        fields = ["id", "student_name", "comment", "created_at"]

class NoticeAcknowledgementSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.username", read_only=True)

    class Meta:
        model = NoticeAcknowledgement
        fields = ["id", "student_name", "acknowledged_at"]

class NoticeSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_avatar = serializers.SerializerMethodField()
    comments = NoticeCommentSerializer(many=True, read_only=True)
    acknowledgements_count = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()

    def get_acknowledgements_count(self, obj):
        return obj.acknowledgements.count()

    class Meta:
        model = Notice
        fields = [
            "id", "title", "content", "image", "created_at",
            "author_name", "author_avatar", "comments", "acknowledgements_count", "views",
            "can_delete", "can_edit",
            "target_dept_admin", "target_staff", "target_student", "target_department"
        ]
        extra_kwargs = {
            "target_dept_admin": {"required": False},
            "target_staff": {"required": False},
            "target_student": {"required": False},
            "target_department": {"required": False, "allow_null": True},
        }

    def _has_permission(self, user, author):
        if not user or not user.is_authenticated:
            return False
        if user == author:
            return True
        
        # Hierarchy Definition
        # SUPER_ADMIN/PRINCIPAL (3) > DEPT_ADMIN (2) > DEPT_STAFF (1) > STUDENT (0)
        LEVELS = {
            "SUPER_ADMIN": 3,
            "PRINCIPAL": 3,
            "DEPT_ADMIN": 2,
            "DEPT_STAFF": 1,
            "DEPT_STUDENT": 0
        }
        
        user_level = LEVELS.get(user.role, 0)
        author_level = LEVELS.get(author.role, 0) if author else 0
        
        # Higher level can edit/delete lower level
        return user_level > author_level

    def get_can_delete(self, obj):
        request = self.context.get('request')
        if not request: return False
        return self._has_permission(request.user, obj.author)

    def get_can_edit(self, obj):
        request = self.context.get('request')
        if not request: return False
        return self._has_permission(request.user, obj.author)

    def get_author_name(self, obj):
        try:
            if hasattr(obj.author, "staff_profile"):
                return f"{obj.author.first_name} {obj.author.last_name}".strip() or obj.author.username
        except Exception:
            pass
            
        try:
             if hasattr(obj.author, "admin_profile"):
                 return f"{obj.author.first_name} {obj.author.last_name}".strip() or obj.author.username
        except Exception:
            pass
            
        return obj.author.username

    def get_author_avatar(self, obj):
        request = self.context.get('request')
        avatar_url = None
        
        # Safely attempt to get avatar from staff profile
        try:
            if hasattr(obj.author, "staff_profile") and obj.author.staff_profile and obj.author.staff_profile.avatar:
                avatar_url = obj.author.staff_profile.avatar.url
        except Exception:
            pass
            
        # Safely attempt to get avatar from admin profile
        if not avatar_url:
            try:
                if hasattr(obj.author, "admin_profile") and obj.author.admin_profile and obj.author.admin_profile.avatar:
                    avatar_url = obj.author.admin_profile.avatar.url
            except Exception:
                pass

        # Safely attempt to get avatar from student account
        if not avatar_url:
            try:
                if hasattr(obj.author, "student_account") and obj.author.student_account.avatar:
                    avatar_url = obj.author.student_account.avatar.url
            except Exception:
                pass
        
        if avatar_url and request:
            return request.build_absolute_uri(avatar_url)
        return avatar_url


class AccountRequestSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    class Meta:
        model = AccountRequest
        fields = "__all__"


class UserCreationRequestSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    class Meta:
        model = UserCreationRequest
        fields = ['id', 'uploaded_by', 'uploaded_by_name', 'department', 'department_name', 'file', 'status', 'created_at', 'admin_comment']
        read_only_fields = ['uploaded_by', 'department', 'status', 'created_at']

class AttendanceHistorySerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    staff_name = serializers.CharField(source="staff.username", read_only=True)
    department_name = serializers.CharField(source="staff.department.name", read_only=True)
    present_count = serializers.IntegerField(read_only=True)
    absent_count = serializers.IntegerField(read_only=True)
    total_count = serializers.IntegerField(read_only=True)
    percentage = serializers.FloatField(read_only=True)

    class Meta:
        model = AttendanceSession
        fields = [
            'id', 'date', 'start_time', 'end_time', 'year', 'section',
            'subject_name', 'staff_name', 'department_name',
            'present_count', 'absent_count', 'total_count', 'percentage',
            'hour', 'mode_of_hour', 'class_mode', 'topics_covered'
        ]

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'is_read', 'target_url', 'created_at']
