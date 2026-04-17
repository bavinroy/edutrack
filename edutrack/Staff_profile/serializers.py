from rest_framework import serializers
from Staff_profile.models import StaffProfile
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class StaffProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    role = serializers.CharField(source="user.role", read_only=True)
    department = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = StaffProfile
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "phone_number",
            "department",
            "designation",
            "avatar_url",
            "avatar", # Expose direct path too
            "date_joined",
        ]

    def get_department(self, obj):
        if obj.department:
            # Check if it's a ForeignKey (unlikely based on models.py but being safe)
            if hasattr(obj.department, 'name'):
                return obj.department.name
            return str(obj.department)
            
        # Fallback to User's department link if staff profile field is empty
        if obj.user and obj.user.department:
            return obj.user.department.name
            
        return "General"

    def get_avatar_url(self, obj):
        request = self.context.get("request")
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        return None


class UpdateStaffProfileSerializer(serializers.ModelSerializer):
    """Only allow updating non-sensitive fields"""
    first_name = serializers.CharField(source="user.first_name", required=False)
    last_name = serializers.CharField(source="user.last_name", required=False)
    email = serializers.EmailField(source="user.email", required=False)

    class Meta:
        model = StaffProfile
        fields = [
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "department",
            "designation",
            "avatar",
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user
        
        if user:
            for attr, value in user_data.items():
                setattr(user, attr, value)
            user.save()
            
        return super().update(instance, validated_data)


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
