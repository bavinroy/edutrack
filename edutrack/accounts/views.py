# accounts/views.py
from rest_framework import status, permissions, serializers
from django.db import models
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from Staff_profile.models import StaffProfile 
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from .permissions import IsAdmin, IsAdminOrStaff
from .models import User, Student
from .serializers import UserSerializer, StudentSerializer, CustomTokenObtainPairSerializer
from rest_framework.permissions import IsAuthenticated
from .models import Document
from .serializers import DocumentSerializer
from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework import viewsets
from .models import TimeTable
from .serializers import TimeTableSerializer
from .permissions import IsStaffOrAdmin
from .permissions import IsStudent, IsStaff, IsAdmin
from .models import  Student
from .models import Letter
from .serializers import LetterSerializer
from .models import  Request, RequestHistory
from .serializers import  RequestSerializer
from .serializers import RequestActionSerializer, AdminActionSerializer
from .models import Notice, NoticeAcknowledgement, NoticeComment
from .serializers import NoticeSerializer,  NoticeAcknowledgementSerializer, NoticeCommentSerializer

class TimeTableListCreateView(generics.ListCreateAPIView):
    queryset = TimeTable.objects.all()
    serializer_class = TimeTableSerializer
    permission_classes = [IsStaffOrAdmin]  # GET allowed for authenticated, POST for staff/admin

    def get_queryset(self):
        # Optionally filter by query params: class_name, section, year
        qs = super().get_queryset()
        class_name = self.request.query_params.get("class_name")
        section = self.request.query_params.get("section")
        year = self.request.query_params.get("year")
        if class_name:
            qs = qs.filter(class_name__iexact=class_name)
        if section:
            qs = qs.filter(section__iexact=section)
        if year:
            qs = qs.filter(year__iexact=year)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class TimeTableRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = TimeTable.objects.all()
    serializer_class = TimeTableSerializer
    permission_classes = [IsStaffOrAdmin]  # GET OK for authenticated, PUT/DELETE restricted to staff/admin

    def patch(self, request, *args, **kwargs):
        # allow partial update (e.g. modify grid)
        return self.partial_update(request, *args, **kwargs)
    
class StudentTimeTableListView(generics.ListAPIView):
    queryset = TimeTable.objects.all()
    serializer_class = TimeTableSerializer
    permission_classes = [permissions.IsAuthenticated]  # any logged-in student

    def get_queryset(self):
        """
        Students can filter timetables by class_name, section, year.
        Example: /student/timetables/?class_name=IV CSE&section=A&year=2025
        """
        qs = super().get_queryset()
        class_name = self.request.query_params.get("class_name")
        section = self.request.query_params.get("section")
        year = self.request.query_params.get("year")
        if class_name:
            qs = qs.filter(class_name__iexact=class_name)
        if section:
            qs = qs.filter(section__iexact=section)
        if year:
            qs = qs.filter(year__iexact=year)
        return qs


class StudentTimeTableDetailView(generics.RetrieveAPIView):
    queryset = TimeTable.objects.all()
    serializer_class = TimeTableSerializer
    permission_classes = [permissions.IsAuthenticated]  # any logged-in student

# List all timetables created by staff
class TimeTableListView(generics.ListAPIView):
    queryset = TimeTable.objects.all().order_by("-created_at")
    serializer_class = TimeTableSerializer
    permission_classes = [permissions.IsAuthenticated]

# Delete a timetable
class TimeTableDeleteView(generics.DestroyAPIView):
    queryset = TimeTable.objects.all()
    serializer_class = TimeTableSerializer
    permission_classes = [permissions.IsAuthenticated]
# -------------------------------
# Custom Permissions
# -------------------------------
class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"

class IsStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "staff"

class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "student"

class IsAdminOrStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.role in ["admin", "staff"])

# -------------------------------
# Login View
# -------------------------------
@api_view(["POST"])
def login_view(request):
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(username=username, password=password)

    if user is not None:
        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "role": user.role,  # send user role too
        }, status=status.HTTP_200_OK)
    return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)




# -------------------------------
# Who am I
# -------------------------------
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def whoami(request):
    return Response({
        "username": request.user.username,
        "role": request.user.role
    })


# -------------------------------
# Dashboards
# -------------------------------
@api_view(["GET"])
@permission_classes([IsAdmin])
def admin_dashboard(request):
    return Response({"message": f"Welcome Admin {request.user.username}"})

@api_view(["GET"])
@permission_classes([IsStaff])
def staff_dashboard(request):
    return Response({"message": f"Welcome Staff {request.user.username}"})

@api_view(["GET"])
@permission_classes([IsStudent])
def student_dashboard(request):
    return Response({"message": f"Welcome Student {request.user.username}"})

# -------------------------------
# JWT Token View
# -------------------------------
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

# Staff upload (no extra restriction, just logged in)
class DocumentUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = DocumentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(uploaded_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class DocumentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        documents = Document.objects.all().order_by("-id")  # latest first
        serializer = DocumentSerializer(documents, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class DocumentDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            doc = Document.objects.get(pk=pk)
            doc.delete()
            return Response({"message": "Document deleted successfully"}, status=status.HTTP_200_OK)
        except Document.DoesNotExist:
            return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)




# 1. Create + list (own letters + shared letters)
class LetterListCreateView(generics.ListCreateAPIView):
    serializer_class = LetterSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Letter.objects.filter(
            models.Q(owner=user) | models.Q(is_shared=True)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


# 2. Update + delete only own letters
class LetterDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LetterSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Letter.objects.filter(owner=self.request.user)


class CreateRequestView(generics.CreateAPIView):
    queryset = Request.objects.all()
    serializer_class = RequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        letter_id = self.request.data.get("letter")
        staff_id = self.request.data.get("staff")
        
        try:
           letter = Letter.objects.get(id=letter_id)
           staff_profile = StaffProfile.objects.get(id=staff_id)  # use StaffProfile here
        except Letter.DoesNotExist:
           raise serializers.ValidationError({"letter": "Letter not found"})
        except StaffProfile.DoesNotExist:
           raise serializers.ValidationError({"staff": "Staff not found"})
        
        staff_profile = StaffProfile.objects.get(id=staff_id)
        req = serializer.save(student=self.request.user, letter=letter, staff=staff_profile)

        RequestHistory.objects.create(
        request=req,
        user=self.request.user,
        action="submitted",
        status="pending"
        )


# 6. Student sees all requests + status
class StudentRequestsListView(generics.ListAPIView):
    serializer_class = RequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Request.objects.filter(student=self.request.user)
 


# 2. Staff sees all requests assigned to them
class StaffRequestsListView(generics.ListAPIView):
    serializer_class = RequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        try:
            staff_profile = StaffProfile.objects.get(user=self.request.user)
        except StaffProfile.DoesNotExist:
            return Request.objects.none()
        
        return Request.objects.filter(staff=staff_profile)


# 3. Staff approves/rejects a request
class StaffActionView(generics.UpdateAPIView):
    queryset = Request.objects.all()
    serializer_class = RequestActionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        req = self.get_object()
        serializer = self.get_serializer(req, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # optional: log action in history
            RequestHistory.objects.create(
                request=req,
                user=request.user,
                action=req.staff_status,
                status=req.staff_status,
            )
            return Response(RequestSerializer(req).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 1. Admin sees all staff-approved requests
class AdminRequestsListView(generics.ListAPIView):
    serializer_class = RequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only show requests where staff has approved
        return Request.objects.filter(staff_status="approved")

# 2. Admin approves/rejects a request
class AdminActionView(generics.UpdateAPIView):
    queryset = Request.objects.all()
    serializer_class = AdminActionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        req = self.get_object()
        req.admin_status = request.data.get("admin_status")
        req.admin_comment = request.data.get("admin_comment", "")
        req.save()
        return Response(RequestSerializer(req).data)
 


# ✅ List all notices
class NoticeListView(generics.ListAPIView):
    queryset = Notice.objects.all()
    serializer_class = NoticeSerializer
    permission_classes = [permissions.IsAuthenticated]

# ✅ Create notice (staff/admin)
class NoticeCreateView(generics.CreateAPIView):
    queryset = Notice.objects.all()
    serializer_class = NoticeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

# ✅ Delete notice
class NoticeDeleteView(generics.DestroyAPIView):
    queryset = Notice.objects.all()
    serializer_class = NoticeSerializer
    permission_classes = [permissions.IsAuthenticated]

# ✅ Acknowledge Notice
class NoticeAcknowledgeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            notice = Notice.objects.get(pk=pk)
            ack, created = NoticeAcknowledgement.objects.get_or_create(
                notice=notice, student=request.user
            )
            if created:
                return Response({"message": "Acknowledged successfully"}, status=status.HTTP_201_CREATED)
            return Response({"message": "Already acknowledged"}, status=status.HTTP_200_OK)
        except Notice.DoesNotExist:
            return Response({"error": "Notice not found"}, status=status.HTTP_404_NOT_FOUND)

# ✅ Comment on Notice
class NoticeCommentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            notice = Notice.objects.get(pk=pk)
            comment_text = request.data.get("comment")
            if not comment_text:
                return Response({"error": "Comment cannot be empty"}, status=status.HTTP_400_BAD_REQUEST)

            comment = NoticeComment.objects.create(
                notice=notice, student=request.user, comment=comment_text
            )
            return Response(NoticeCommentSerializer(comment).data, status=status.HTTP_201_CREATED)
        except Notice.DoesNotExist:
            return Response({"error": "Notice not found"}, status=status.HTTP_404_NOT_FOUND)
        
# Delete comment
class NoticeCommentDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            comment = NoticeComment.objects.get(pk=pk, student=request.user)
            comment.delete()
            return Response({"message": "Comment deleted"}, status=status.HTTP_204_NO_CONTENT)
        except NoticeComment.DoesNotExist:
            return Response({"error": "Comment not found or not permitted"}, status=status.HTTP_404_NOT_FOUND)

# Edit comment
class NoticeCommentEditView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            comment = NoticeComment.objects.get(pk=pk, student=request.user)
            new_text = request.data.get("comment")
            if not new_text:
                return Response({"error": "Comment cannot be empty"}, status=status.HTTP_400_BAD_REQUEST)
            
            comment.comment = new_text
            comment.save()
            return Response(NoticeCommentSerializer(comment).data, status=status.HTTP_200_OK)
        except NoticeComment.DoesNotExist:
            return Response({"error": "Comment not found or not permitted"}, status=status.HTTP_404_NOT_FOUND)