from rest_framework import serializers
from .models import StaffProfile
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class StaffProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    role = serializers.CharField(source="user.role", read_only=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = StaffProfile
        fields = [
            "id",
            "username",
            "email",
            "role",
            "phone_number",
            "department",
            "designation",
            "avatar_url",
            "date_joined",
        ]

    def get_avatar_url(self, obj):
        request = self.context.get("request")
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        return None


class UpdateStaffProfileSerializer(serializers.ModelSerializer):
    """Only allow updating non-sensitive fields"""
    class Meta:
        model = StaffProfile
        fields = [
            "phone_number",
            "department",
            "designation",
            "avatar",
        ]


class CreateStaffUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def create(self, validated_data):
        user = User(
            username=validated_data["username"],
            email=validated_data["email"],
            role=User.Roles.STAFF,  # mark as staff
        )
        user.set_password(validated_data["password"])
        user.save()
        # Optionally create StaffProfile automatically
        StaffProfile.objects.create(user=user)
        return user
