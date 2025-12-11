# staff_profile/views.py
import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import StaffProfile
from .serializers import StaffProfileSerializer, UpdateStaffProfileSerializer, CreateStaffUserSerializer
from rest_framework import status
from django.contrib.auth.password_validation import validate_password
from rest_framework import generics, permissions
from django.contrib.auth import get_user_model
from .serializers import StaffProfileSerializer
from rest_framework.generics import ListAPIView


User = get_user_model()
logger = logging.getLogger(__name__)

# -----------------------------
# GET: /api/staff/profile/
# -----------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_staff_profile(request):
    user = request.user
    logger.info(f"Fetching profile for user: {user.username}")

    try:
        profile = StaffProfile.objects.get(user=user)
    except StaffProfile.DoesNotExist:
        profile = StaffProfile.objects.create(user=user)
        logger.info(f"Auto-created staff profile for user {user.username}")

    serializer = StaffProfileSerializer(profile, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)


# -----------------------------
# PUT/PATCH: /api/staff/profile/update/
# -----------------------------
@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def update_staff_profile(request):
    user = request.user
    logger.info(f"Updating profile for user: {user.username}, files={list(request.FILES.keys())}")

    try:
        profile = StaffProfile.objects.get(user=user)
    except StaffProfile.DoesNotExist:
        return Response({"detail": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = UpdateStaffProfileSerializer(profile, data=request.data, partial=True, context={"request": request})
    if serializer.is_valid():
        serializer.save()
        updated_profile = StaffProfileSerializer(profile, context={"request": request})
        return Response(updated_profile.data, status=status.HTTP_200_OK)
    else:
        logger.warning(f"Profile update validation errors: {serializer.errors}")
        return Response({"detail": "Invalid data", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


# -----------------------------
# POST: /api/staff/create-user/
# -----------------------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_staff_user(request):
    if not request.user.is_superuser:
        return Response({"detail": "Only admin can create staff."}, status=status.HTTP_403_FORBIDDEN)

    serializer = CreateStaffUserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            {"message": "Staff user created successfully", "username": user.username},
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from django.contrib.auth.password_validation import validate_password

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_staff_password(request):
    """
    Endpoint: POST /api/staff/profile/change-password/
    Payload: { "old_password": "...", "new_password": "..." }
    """
    user = request.user
    old_password = request.data.get("old_password")
    new_password = request.data.get("new_password")

    if not old_password or not new_password:
        return Response({"error": "Both old and new passwords are required"}, status=status.HTTP_400_BAD_REQUEST)

    if not user.check_password(old_password):
        return Response({"error": "Old password is incorrect"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        validate_password(new_password, user=user)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()
    return Response({"message": "Password changed successfully"}, status=status.HTTP_200_OK)


class StaffProfileListView(generics.ListAPIView):
    """
    GET /api/staff/list/
    Returns all staff and admin profiles
    """
    queryset = StaffProfile.objects.select_related("user").all()
    serializer_class = StaffProfileSerializer
    permission_classes = [permissions.IsAuthenticated]