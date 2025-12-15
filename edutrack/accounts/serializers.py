
# accounts/serializers.py
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    User, Student, Department, Subject, Document, TimeTable, 
    Letter, Request, RequestHistory, Notice, NoticeAcknowledgement, NoticeComment
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
    password = serializers.CharField(write_only=True)
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), source='department', required=False, allow_null=True
    )

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "department_id", "role"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
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

    class Meta:
        model = Student
        fields = ['id', 'user', 'department', 'roll_number']

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

class AdminActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Request
        fields = ["admin_status", "admin_comment"]

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

