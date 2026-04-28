import secrets
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.contrib.auth.hashers import make_password, check_password
from accounts.models import PasswordResetOTP

User = get_user_model()

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        email = request.data.get("email")
        
        if not username or not email:
            return Response({"error": "Both Username (or Register No) and Email are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Look for user matching BOTH username and email exactly
        user = User.objects.filter(username=username, email=email).first()

        if not user:
            return Response({"error": "No account found matching this Username and Email combination."}, status=status.HTTP_404_NOT_FOUND)

        # Rate Limiting: Max 3 requests per 15 minutes
        recent_requests = PasswordResetOTP.objects.filter(
            user=user,
            created_at__gte=timezone.now() - timedelta(minutes=15)
        ).count()

        if recent_requests >= 3:
            return Response({"error": "Too many OTP requests. Please try again later."}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # Generate cryptographically secure 6-digit OTP
        otp_plain = "".join(secrets.choice("0123456789") for _ in range(6))
        
        # Save OTP (Hashed for security)
        PasswordResetOTP.objects.create(user=user, otp=make_password(otp_plain))
        
        # Send Email
        subject = "Password Reset Request - EduTrack"
        message = f"Hello {user.first_name or user.username},\n\nYour One-Time Password (OTP) for password reset is: {otp_plain}\n\nThis OTP is valid for 15 minutes.\n\nIf you did not request this, please ignore this email.\n\nBest,\nEduTrack Team"
        
        try:
            from_email = getattr(settings, 'EMAIL_HOST_USER', 'noreply@edutrack.com')
            send_mail(
                subject,
                message,
                from_email,
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Failed to send email: {e}")
            return Response({"error": "Failed to send OTP email. Please try again later."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"message": "OTP sent successfully to your registered email."}, status=status.HTTP_200_OK)

class PasswordResetVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        otp = request.data.get("otp")

        if not username or not otp:
            return Response({"error": "Username and OTP are required"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(username=username).first()
        if not user:
            return Response({"error": "Invalid request"}, status=status.HTTP_400_BAD_REQUEST)

        # Find latest active OTPs
        otp_records = PasswordResetOTP.objects.filter(user=user, is_used=False).order_by('-created_at')[:5] # Check last 5 to avoid brute force but allow retry
        
        valid_otp_record = None
        for record in otp_records:
            if not record.is_expired() and check_password(otp, record.otp):
                valid_otp_record = record
                break

        if not valid_otp_record:
            return Response({"error": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"message": "OTP verified successfully. Please proceed to reset password."}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        otp = request.data.get("otp")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if not all([username, otp, new_password, confirm_password]):
            return Response({"error": "All fields are required"}, status=status.HTTP_400_BAD_REQUEST)

        if new_password != confirm_password:
            return Response({"error": "Passwords do not match"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(username=username).first()
        if not user:
            return Response({"error": "Invalid request"}, status=status.HTTP_400_BAD_REQUEST)

        otp_records = PasswordResetOTP.objects.filter(user=user, is_used=False).order_by('-created_at')[:5]
        
        valid_otp_record = None
        for record in otp_records:
            if not record.is_expired() and check_password(otp, record.otp):
                valid_otp_record = record
                break

        if not valid_otp_record:
            return Response({"error": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST)

        # Update password
        user.set_password(new_password)
        user.save()

        # Mark OTP as used
        valid_otp_record.is_used = True
        valid_otp_record.save()

        return Response({"message": "Password has been reset successfully."}, status=status.HTTP_200_OK)
