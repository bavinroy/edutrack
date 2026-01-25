
# accounts/serializers.py
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    User, Student, Department, Subject, Document, TimeTable, 
    Letter, Request, RequestHistory, Notice, NoticeAcknowledgement, NoticeComment, ClassAdvisor
)

# --- User Serializers ---

class SimpleUserSerializer(serializers.ModelSerializer):
    """
    Minimal user serializer used when we only need username / id in nested responses.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "role", "first_name", "last_name"]

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

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "department_id", "role", "year"]

    def validate(self, data):
        # If creating a student, 'year', 'first_name', 'last_name', and 'department' are mandatory
        if data.get('role') == User.Roles.DEPT_STUDENT:
             if not data.get('year'):
                 raise serializers.ValidationError({"year": "Year is required for students."})
             if not data.get('first_name'):
                 raise serializers.ValidationError({"first_name": "First Name is required for students."})
             if not data.get('last_name'):
                 raise serializers.ValidationError({"last_name": "Last Name is required for students."})
             
             # Check department: either in data OR already in instance (not applicable for create) OR via context?
             # NOTE: Views assign department via serializer.save() kwargs if the user is Dept Admin.
             # But validating existence here checks 'data'. 
             # Only strictly require it in 'data' if the request user is SUPER_ADMIN/PRINCIPAL who must select it.
             # However, serializer context has 'request'.
             request = self.context.get('request')
             if request and request.user.role in [User.Roles.SUPER_ADMIN, User.Roles.PRINCIPAL]:
                 if not data.get('department_id'):
                     raise serializers.ValidationError({"department_id": "Department is required for students created by Admins."})
        return data

    def create(self, validated_data):
        password = validated_data.pop("password")
        year_val = validated_data.pop("year", None)
        
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        
        # If student, create Student entry
        if user.role == User.Roles.DEPT_STUDENT:
             Student.objects.create(
                 user=user,
                 roll_no=user.username, # Default roll no to username
                 year=year_val,
                 course=user.department.name if user.department else "General"
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


class StudentSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)
    department_name = serializers.CharField(source='user.department.name', read_only=True)

    class Meta:
        model = Student
        fields = ['id', 'user', 'department_name', 'roll_no', 'year', 'course']

class ClassAdvisorSerializer(serializers.ModelSerializer):
    advisor1_name = serializers.StringRelatedField(source='advisor1', read_only=True)
    advisor2_name = serializers.StringRelatedField(source='advisor2', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    department = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = ClassAdvisor
        fields = ['id', 'department', 'department_name', 'year', 'advisor1', 'advisor1_name', 'advisor2', 'advisor2_name']

# --- Department & Subject ---

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name']

class SubjectSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), source='department', write_only=True
    )

    class Meta:
        model = Subject
        fields = ['id', 'name', 'department', 'department_id']

# --- Document ---

class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Document
        fields = "__all__"

# --- TimeTable ---

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
    comments = NoticeCommentSerializer(many=True, read_only=True)
    acknowledgements_count = serializers.SerializerMethodField()

    class Meta:
        model = Notice
        fields = [
            "id", "title", "content", "image", "created_at",
            "author_name", "comments", "acknowledgements_count",
        ]

    def get_author_name(self, obj):
        if hasattr(obj.author, "staffprofile"):
            return obj.author.staffprofile.user.username
        elif hasattr(obj.author, "adminprofile"):
            return obj.author.adminprofile.user.username
        return obj.author.username

    def get_acknowledgements_count(self, obj):
        return obj.acknowledgements.count()

