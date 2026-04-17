# student_profile/views.py
import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from student_profile.models import StudentProfile, Feedback
from student_profile.serializers import StudentProfileSerializer, UpdateStudentProfileSerializer
from django.contrib.auth import get_user_model
from student_profile.serializers import CreateStaffSerializer, CreateStudentSerializer


User = get_user_model()
logger = logging.getLogger(__name__)

# -----------------------------
# GET: /api/student/profile/
# -----------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_student_profile(request):
    user = request.user
    logger.info(f"Fetching profile for user: {user.username}")

    try:
        profile = StudentProfile.objects.get(user=user)
    except StudentProfile.DoesNotExist:
        # Optionally auto-create profile
        default_roll = f"user_{user.id}"
        profile = StudentProfile.objects.create(user=user, roll_number=default_roll)
        logger.info(f"Auto-created profile for user {user.username} with roll_number={default_roll}")

    serializer = StudentProfileSerializer(profile, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)

# -----------------------------
# PUT/PATCH: /api/student/profile/update/
# -----------------------------
@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def update_student_profile(request):
    user = request.user
    logger.info(f"Updating profile for user: {user.username}, files={list(request.FILES.keys())}")

    try:
        profile = StudentProfile.objects.get(user=user)
    except StudentProfile.DoesNotExist:
        return Response({"detail": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = UpdateStudentProfileSerializer(profile, data=request.data, partial=True, context={"request": request})
    if serializer.is_valid():
        serializer.save()
        updated_profile = StudentProfileSerializer(profile, context={"request": request})
        return Response(updated_profile.data, status=status.HTTP_200_OK)
    else:
        logger.warning(f"Profile update validation errors: {serializer.errors}")
        return Response({"detail": "Invalid data", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

# -----------------------------
# POST: /api/student/profile/change-password/
# -----------------------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    old_password = request.data.get("old_password")
    new_password = request.data.get("new_password")

    if not old_password or not new_password:
        return Response({"error": "Both old and new passwords are required"}, status=status.HTTP_400_BAD_REQUEST)

    if not user.check_password(old_password):
        return Response({"error": "Old password is incorrect"}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()
    return Response({"message": "Password changed successfully"})

# 🔹 Helper permission check
def is_admin(user):
    return user.is_superuser or user.is_staff and user.is_superuser  # superuser = Admin

def is_staff(user):
    return user.is_staff and not user.is_superuser  # staff but not admin


# Create Staff (✅ Only Admin allowed)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_staff(request):
    if not request.user.is_superuser:  # only admin can create staff
        return Response({"detail": "Only admin can create staff."}, status=status.HTTP_403_FORBIDDEN)

    serializer = CreateStaffSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            {"message": "Staff created successfully", "username": user.username},
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Create Student (✅ Admin + Staff allowed)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_student(request):
    if not (request.user.is_superuser or request.user.is_staff):
        return Response({"detail": "Only admin/staff can create students."}, status=status.HTTP_403_FORBIDDEN)

    serializer = CreateStudentSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            {"message": "Student created successfully", "username": user.username},
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# -----------------------------
# POST: /api/student/feedback/
# -----------------------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_feedback(request):
    user = request.user
    subject = request.data.get("subject")
    message = request.data.get("message")
    category = request.data.get("category", "General")
    
    if not subject or not message:
        return Response({"detail": "Subject and message are required."}, status=status.HTTP_400_BAD_REQUEST)
    
    feedback = Feedback.objects.create(
        user=user,
        subject=subject,
        message=message,
        category=category
    )
    logger.info(f"Feedback submitted by {user.username}: {subject}")
    return Response({"detail": "Feedback submitted successfully.", "id": feedback.id}, status=status.HTTP_201_CREATED)
