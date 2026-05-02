from rest_framework import serializers
from student_profile.models import StudentProfile
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from accounts.models import Student

User = get_user_model()

class StudentProfileSerializer(serializers.ModelSerializer):
    # fetch related user fields
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    student_id = serializers.CharField(source="roll_no", read_only=True)  # alias for roll_no
    display_name = serializers.CharField(source="user.display_name", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    date_joined = serializers.DateTimeField(source="user.date_joined", read_only=True)
    role = serializers.CharField(source="user.get_role_display", read_only=True)
    last_login = serializers.DateTimeField(source="user.last_login", read_only=True)
    
    # Map phone_number to mobile_number for frontend compatibility
    phone_number = serializers.CharField(source="mobile_number", read_only=True)
    
    # Fetch academic info
    department = serializers.CharField(source="department.name", read_only=True)
    course = serializers.CharField(read_only=True)
    year = serializers.IntegerField(read_only=True)
    semester = serializers.IntegerField(read_only=True)

    class Meta:
        model = Student
        fields = [
            "username",
            "email",
            "student_id",
            "display_name",
            "first_name",
            "last_name",
            "date_joined",
            "role",
            "last_login",
            "phone_number",
            "department",
            "year",
            "semester",
            "course",
            "avatar",
            "avatar_url",
        ]

    avatar_url = serializers.SerializerMethodField()

    def get_avatar_url(self, obj):
        request = self.context.get("request")
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        return None


class UpdateStudentProfileSerializer(serializers.ModelSerializer):
    """Only allow updating non-sensitive fields"""
    first_name = serializers.CharField(source="user.first_name", required=False)
    last_name = serializers.CharField(source="user.last_name", required=False)
    email = serializers.EmailField(source="user.email", required=False)
    # Map phone_number to mobile_number
    phone_number = serializers.CharField(source="mobile_number", required=False)

    class Meta:
        model = Student
        fields = [
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "avatar",
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user
        
        # Manually update user fields if present
        if user:
            for attr, value in user_data.items():
                setattr(user, attr, value)
            user.save()

        return super().update(instance, validated_data)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value

class CreateStaffSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def create(self, validated_data):
        user = User(
            username=validated_data["username"],
            email=validated_data["email"],
            is_staff=True,  # mark as staff
        )
        user.set_password(validated_data["password"])
        user.save()
        return user


class CreateStudentSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    roll_number = serializers.CharField(required=True)
    department = serializers.CharField(required=False)
    course = serializers.CharField(required=False)
    year = serializers.IntegerField(required=False)
    phone_number = serializers.CharField(required=False)

    class Meta:
        model = User
        fields = ["username", "email", "password", "roll_number", "department", "course", "year", "phone_number"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        roll_number = validated_data.pop("roll_number")

        # Create base user
        user = User(
            username=validated_data["username"],
            email=validated_data["email"],
        )
        user.set_password(password)
        user.save()

        # Create student profile
        StudentProfile.objects.create(
            user=user,
            roll_number=roll_number,
            phone_number=validated_data.get("phone_number", ""),
            department=validated_data.get("department", ""),
            year=validated_data.get("year", None),
        )

        # Create accounts.model.Student (Syncing)
        Student.objects.create(
            user=user,
            roll_no=roll_number,
            course=validated_data.get("course", "General"),
            year=validated_data.get("year", None)
        )

        return user
