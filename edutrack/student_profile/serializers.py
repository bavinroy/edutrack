from rest_framework import serializers
from .models import StudentProfile
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password



User = get_user_model()


class StudentProfileSerializer(serializers.ModelSerializer):
    # fetch related user fields
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    student_id = serializers.CharField(source="roll_number", read_only=True)  # alias for roll_number

    class Meta:
        model = StudentProfile
        fields = [
            "username",
            "email",
            "student_id",
            "phone_number",
            "department",
            "year",
            "avatar",
        ]


class UpdateStudentProfileSerializer(serializers.ModelSerializer):
    """Only allow updating non-sensitive fields"""
    class Meta:
        model = StudentProfile
        fields = [
            "phone_number",
            "department",
            "year",
            "avatar",
        ]


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
    year = serializers.IntegerField(required=False)
    phone_number = serializers.CharField(required=False)

    class Meta:
        model = User
        fields = ["username", "email", "password", "roll_number", "department", "year", "phone_number"]

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
        return user
    
