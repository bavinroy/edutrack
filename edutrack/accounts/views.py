# accounts/views.py
from rest_framework import status, permissions, serializers, generics, viewsets
from django.db import models, transaction
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated

# Models
from Staff_profile.models import StaffProfile 
from .models import (
    User, Student, Document, TimeTable, Letter, 
    Request, RequestHistory, Notice, NoticeAcknowledgement, NoticeComment, Department
)

# Serializers
from .serializers import (
    UserSerializer, StudentSerializer, CustomTokenObtainPairSerializer,
    DocumentSerializer, TimeTableSerializer, LetterSerializer,
    RequestSerializer, RequestActionSerializer, AdminActionSerializer,
    NoticeSerializer, NoticeAcknowledgementSerializer, NoticeCommentSerializer,
    UserCreateSerializer, BulkUploadSerializer, DepartmentSerializer
)

# Permissions
from .permissions import (
    IsAdmin, IsStaff, IsStudent, IsStaffOrAdmin,
    IsSuperAdmin, IsPrincipal, IsDepartmentAdmin, IsDepartmentStaff
)

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
    permission_classes = [IsAuthenticated]  # any logged-in student

    def get_queryset(self):
        """
        Students can filter timetables by class_name, section, year.
        Example: /student/timetables/?class_name=IV CSE&section=A&year=2025
        """
        user = self.request.user
        # Only show published timetables
        qs = TimeTable.objects.filter(status='published')
        
        # Filter by student's department if they have one assigned
        if user.department:
            qs = qs.filter(department=user.department)
        
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
    permission_classes = [IsAuthenticated]  # any logged-in student

# List all timetables created by staff
class TimeTableListView(generics.ListAPIView):
    serializer_class = TimeTableSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TimeTable.objects.filter(created_by=self.request.user).order_by("-created_at")

class TimeTablePublishView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            timetable = TimeTable.objects.get(pk=pk, created_by=request.user)
            # Allow resubmit if rejected or draft
            if timetable.status not in ['draft', 'rejected', 'pending_verification']:
                 # If already published, maybe allow update? For now restrict.
                 pass

            timetable.status = 'pending_verification'
            timetable.save()
            return Response({"message": "Timetable sent for verification", "status": timetable.status})
        except TimeTable.DoesNotExist:
            return Response({"error": "Timetable not found"}, status=status.HTTP_404_NOT_FOUND)

class TimeTableVerifyView(APIView):
    permission_classes = [IsAuthenticated, IsDepartmentAdmin]

    def post(self, request, pk):
        try:
            # Dept Admin can only verify timetables in their department
            timetable = TimeTable.objects.get(pk=pk, department=request.user.department)
            action = request.data.get("action") # 'approve' or 'reject'
            
            if action == "approve":
                timetable.status = "published"
                timetable.verified_by = request.user
            elif action == "reject":
                timetable.status = "rejected"
                timetable.verified_by = request.user
            else:
                return Response({"error": "Invalid action. Use 'approve' or 'reject'"}, status=status.HTTP_400_BAD_REQUEST)
            
            timetable.save()
            return Response({"message": f"Timetable {timetable.status}", "status": timetable.status})
        except TimeTable.DoesNotExist:
            return Response({"error": "Timetable not found or not in your department"}, status=status.HTTP_404_NOT_FOUND)

class DeptPendingTimeTableView(generics.ListAPIView):
    serializer_class = TimeTableSerializer
    permission_classes = [IsAuthenticated, IsDepartmentAdmin]

    def get_queryset(self):
        if not self.request.user.department:
            return TimeTable.objects.none()
        return TimeTable.objects.filter(
            department=self.request.user.department, 
            status='pending_verification'
        ).order_by("-updated_at")


# Delete a timetable
class TimeTableDeleteView(generics.DestroyAPIView):
    queryset = TimeTable.objects.all()
    serializer_class = TimeTableSerializer
    permission_classes = [IsAuthenticated]

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
        qs = Request.objects.filter(staff_status="approved")
        user = self.request.user
        
        # If Dept Admin, only show requests from their department users
        if user.is_authenticated and getattr(user, 'is_dept_admin', False):
             if user.department:
                 return qs.filter(student__department=user.department)
             return qs.none() # Dept Admin without department shouldn't see anything
             
        return qs

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



# --- 1. Create Dept Admin (Super Admin / Principal) ---
class CreateDeptAdminView(generics.CreateAPIView):
    serializer_class = UserCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin | IsPrincipal]

    def perform_create(self, serializer):
        # Force role to DEPT_ADMIN
        serializer.save(role=User.Roles.DEPT_ADMIN)

# --- 2. Create Dept Staff (Dept Admin / Super / Principal) ---
class CreateDeptStaffView(generics.CreateAPIView):
    serializer_class = UserCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsDepartmentAdmin | IsSuperAdmin | IsPrincipal]

    def perform_create(self, serializer):
        user = self.request.user
        role = User.Roles.DEPT_STAFF
        
        # If Dept Admin, enforce their department
        if getattr(user, 'is_dept_admin', False):
             serializer.save(role=role, department=user.department)
        else:
             # Super Admin can set any department (handled by serializer input)
             serializer.save(role=role)

# --- 3. Create Dept Student (Dept Staff / Dept Admin / Super / Principal) ---
class CreateDeptStudentView(generics.CreateAPIView):
    serializer_class = UserCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsDepartmentStaff | IsDepartmentAdmin | IsSuperAdmin | IsPrincipal]

    def perform_create(self, serializer):
        user = self.request.user
        role = User.Roles.DEPT_STUDENT
        
        # If Dept Staff or Dept Admin, enforce their department
        if getattr(user, 'is_dept_admin', False) or getattr(user, 'is_dept_staff', False):
             serializer.save(role=role, department=user.department)
        else:
             serializer.save(role=role)

# --- Department Management ---
class DepartmentListCreateView(generics.ListCreateAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin | IsPrincipal]

class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin | IsPrincipal | IsDepartmentAdmin]


# --- 4. Bulk Upload View ---
try:
    import pandas as pd
except ImportError:
    pd = None

class BulkUploadUsersView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        if pd is None:
             return Response({"error": "pandas library not installed on server"}, status=status.HTTP_501_NOT_IMPLEMENTED)

        serializer = BulkUploadSerializer(data=request.data)
        if not serializer.is_valid():
             return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        file = serializer.validated_data['file']
        target_role = serializer.validated_data.get('role')
        
        # Permission Check for Bulk Upload
        user = request.user
        can_create_admin = user.is_super_admin or user.is_principal
        can_create_staff = can_create_admin or user.is_dept_admin
        can_create_student = can_create_staff or getattr(user, 'is_dept_staff', False) # Assuming is_dept_staff property exists or check role

        # If role not specified in request, expect it in file, or default based on creator?
        # Requirement: "Super admin upload excel... create dept admins"
        
        # Read Excel
        try:
            df = pd.read_excel(file)
            # Sanitize headers
            df.columns = [str(c).strip().lower() for c in df.columns]
            
            # 1. Rename 'user name' to 'username' if present
            if 'user name' in df.columns:
                df.rename(columns={'user name': 'username'}, inplace=True)

            # 2. Drop "unnamed" columns (artifacts of formatting)
            df = df.loc[:, ~df.columns.str.contains('^unnamed')]
            
            # 3. Drop rows where ALL critical fields are NaN (empty rows)
            # Check subset of expected columns
            critical_cols = [c for c in ['username', 'email'] if c in df.columns]
            if critical_cols:
                df.dropna(subset=critical_cols, how='all', inplace=True)
                
            print(f"DEBUG: Cleaned columns: {df.columns.tolist()}")
            print(f"DEBUG: First few rows:\n{df.head()}") 
        except Exception as e:
            print(f"DEBUG: Excel read error: {e}")
            return Response({"error": f"Failed to read file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
            
        created_count = 0
        errors = []

        try:
            with transaction.atomic():
                # Remove outer transaction.atomic to allow partial success -> REVERTED at User Request for All-or-Nothing
                for index, row in df.iterrows():
                    try:
                        # Use safe get with sanitized keys
                        username = row.get('username')
                        email = row.get('email')
                        password = str(row.get('password', 'Default@123')) 
                        
                        # Check for NaN/None in critical fields
                        if pd.isna(username) or pd.isna(email):
                            errors.append(f"Row {index}: Missing username or email")
                            continue
                            
                        username = str(username).strip()
                        email = str(email).strip()

                        # Determine Role
                        row_role = target_role or row.get('role')
                        if not row_role or pd.isna(row_role):
                            errors.append(f"Row {index}: Role missing")
                            continue
                        
                        # Normalize Role
                        row_role = str(row_role).strip().upper()

                        # Map common variations
                        role_map = {
                            'STUDENT': User.Roles.DEPT_STUDENT,
                            'STAFF': User.Roles.DEPT_STAFF,
                            'FACULTY': User.Roles.DEPT_STAFF,
                            'TEACHER': User.Roles.DEPT_STAFF,
                            'ADMIN': User.Roles.DEPT_ADMIN,
                            'HOD': User.Roles.DEPT_ADMIN,
                            'DEPT_HOD': User.Roles.DEPT_ADMIN,
                            'DEPT_STUDENT': User.Roles.DEPT_STUDENT,
                            'DEPT_STAFF': User.Roles.DEPT_STAFF,
                            'DEPT_ADMIN': User.Roles.DEPT_ADMIN
                        }
                        if row_role in role_map:
                            row_role = role_map[row_role]

                        # Role Validation
                        if row_role == User.Roles.DEPT_ADMIN and not can_create_admin:
                             errors.append(f"Row {index}: Permission denied to create Dept Admin")
                             continue
                        if row_role == User.Roles.DEPT_STAFF and not can_create_staff:
                             errors.append(f"Row {index}: Permission denied to create Staff")
                             continue
                        if row_role == User.Roles.DEPT_STUDENT and not can_create_student:
                             errors.append(f"Row {index}: Permission denied to create Student")
                             continue
                             
                        # Determine Department
                        from .models import Department
                        dept_name = row.get('department')
                        resolved_department = None
                        
                        # 1. Try to resolve department from Excel input (if provided)
                        if dept_name and not pd.isna(dept_name):
                             dept_name = str(dept_name).strip()
                             
                             # Direct Lookup
                             resolved_department = Department.objects.filter(name__iexact=dept_name).first()
                             
                             # Alias Lookup
                             if not resolved_department:
                                 dept_aliases = {
                                    # Post Graduate
                                    'MBA': ['MASTER OF BUSINESS ADMINISTRATION'],
                                    'ISE': ['INDUSTRIAL SAFETY ENGINEERING'],
                                    'ED': ['ENGINEERING DESIGN'],
                                    'ME AE': ['M.E. APPLIED ELECTRONICS', 'APPLIED ELECTRONICS'],
                                    'ME CSE': ['M.E. COMPUTER SCIENCE AND ENGINEERING', 'M.E CSE'],
        
                                    # Under Graduate
                                    'MECH': ['B.E. MECHANICAL ENGINEERING', 'MECHANICAL ENGINEERING', 'MECHANICAL'],
                                    'ECE': ['B.E. ELECTRONICS & COMMUNICATION ENGINEERING', 'ELECTRONICS & COMMUNICATION ENGINEERING', 'ELECTRONICS AND COMMUNICATION ENGINEERING'],
                                    'CIVIL': ['B.E. CIVIL ENGINEERING', 'CIVIL ENGINEERING'],
                                    'BME': ['B.E. BIOMEDICAL ENGINEERING', 'BIOMEDICAL ENGINEERING', 'BIOMEDICAL'],
                                    'CSE': ['B.E. COMPUTER SCIENCE & ENGINEERING', 'COMPUTER SCIENCE & ENGINEERING', 'COMPUTER SCIENCE AND ENGINEERING'],
                                    'EEE': ['B.E. ELECTRICAL & ELECTRONICS ENGINEERING', 'ELECTRICAL & ELECTRONICS ENGINEERING', 'ELECTRICAL AND ELECTRONICS ENGINEERING'],
                                    'AIDS': ['B.TECH IN ARTIFICIAL INTELLIGENCE & DATA SCIENCE', 'ARTIFICIAL INTELLIGENCE & DATA SCIENCE', 'AI & DS', 'AI AND DS'],
                                    'BIO': ['B.TECH IN BIOTECHNOLOGY', 'BIOTECHNOLOGY', 'BIO TECH', 'BIO MEDICAL ENGINEERING', 'BIO-MED'],
                                    'IT': ['B.TECH IN INFORMATION TECHNOLOGY', 'INFORMATION TECHNOLOGY', 'INFO TECH']
                                 }
                                 
                                 dept_upper = dept_name.upper()
                                 for code, full_names in dept_aliases.items():
                                     if dept_upper == code:
                                         for name in full_names:
                                             resolved_department = Department.objects.filter(name__iexact=name).first()
                                             if resolved_department: break
                                     elif dept_upper in full_names:
                                         resolved_department = Department.objects.filter(name__iexact=code).first()
                                     if resolved_department: break
                                     
                             if not resolved_department:
                                 errors.append(f"Row {index}: Department '{dept_name}' not found")
                                 continue
                        
                        # 2. Assign and Validate Department based on User Role
                        final_department = None
                        
                        if user.role in [User.Roles.DEPT_ADMIN, User.Roles.DEPT_STAFF]:
                            if resolved_department:
                                # User provided a department; Validate it matches their own
                                if resolved_department.id != user.department.id:
                                    errors.append(f"Row {index}: Permission Denied. You cannot create users for '{resolved_department.name}'. Your scope is '{user.department.name}'.")
                                    continue
                                final_department = resolved_department
                            else:
                                # User provided nothing; Default to their own
                                final_department = user.department
                        else:
                            # Super Admin / Principal
                            if resolved_department:
                                final_department = resolved_department
                            else:
                                errors.append(f"Row {index}: Department is required")
                                continue
                        
                        # Double check unique EMAIL
                        if User.objects.filter(email=email).exists():
                             errors.append(f"Row {index}: Email '{email}' already exists")
                             continue
        
                        # Handle Duplicate Usernames
                        original_username = username
                        counter = 1
                        while User.objects.filter(username=username).exists():
                             username = f"{original_username}{counter}"
                             counter += 1
                             
                        # Create User
                        # NOTE: We do NOT use nested transaction.atomic() here because we are already in one big block.
                        new_user = User.objects.create_user(
                            username=username,
                            email=email,
                            password=password,
                            role=row_role,
                            department=final_department
                        )
                        # Assign Permissions
                        assign_role_permissions(new_user)
                        created_count += 1
                        
                    except Exception as e:
                        import traceback
                        traceback.print_exc()
                        errors.append(f"Row {index}: Unexpected error: {str(e)}")
                
                # Check for errors after processing all rows
                if errors:
                    # Rollback EVERYTHING
                    transaction.set_rollback(True)
                    print(f"DEBUG: Bulk Upload Errors (Rolled Back): {errors}")
                    return Response({
                        "message": "Upload rejected due to errors. No users were created.", 
                        "errors": errors
                    }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
             # This catches exceptions that might occur outside the per-row try-except but inside the atomic block
             # e.g., if transaction.atomic() itself fails or a critical error before the loop finishes
             import traceback
             traceback.print_exc()
             return Response({"error": f"An unexpected error occurred during bulk upload: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response({"message": f"Successfully created {created_count} users"}, status=status.HTTP_201_CREATED)

def assign_role_permissions(user):
    """
    Helper to assign default permissions based on role.
    Replicates logic from CustomUserAdmin.save_model
    """
    from django.contrib.auth.models import Permission
    from django.contrib.contenttypes.models import ContentType
    from .models import Student, Notice, Document, Letter, Request, Department, User

    if user.role == User.Roles.DEPT_ADMIN:
        # Full Management: User, Student, Notice, Document, Letter, Request
        manage_models = [User, Student, Notice, Document, Letter, Request]
        perms_to_add = []
        
        for model_cls in manage_models:
            ct = ContentType.objects.get_for_model(model_cls)
            p_list = Permission.objects.filter(content_type=ct, codename__in=[
                f'add_{model_cls._meta.model_name}',
                f'change_{model_cls._meta.model_name}',
                f'delete_{model_cls._meta.model_name}',
                f'view_{model_cls._meta.model_name}'
            ])
            perms_to_add.extend(p_list)
            
        # View Department
        dept_ct = ContentType.objects.get_for_model(Department)
        perms_to_add.extend(Permission.objects.filter(content_type=dept_ct, codename='view_department'))
        
        user.user_permissions.add(*perms_to_add)

    elif user.role == User.Roles.DEPT_STAFF:
        # Manage Student
        student_ct = ContentType.objects.get_for_model(Student)
        student_perms = Permission.objects.filter(content_type=student_ct, codename__in=[
            'add_student', 'change_student', 'delete_student', 'view_student'
        ])
        
        # Manage User (Add/Change/View)
        user_ct = ContentType.objects.get_for_model(User)
        user_perms = Permission.objects.filter(content_type=user_ct, codename__in=[
            'add_user', 'change_user', 'view_user' # Removed delete_user for Staff safety usually, but matches admin logic
        ])
        
        user.user_permissions.add(*student_perms)
        user.user_permissions.add(*user_perms)

class ParseTimetableView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file provided"}, status=400)

        filename = file_obj.name.lower()
        
        try:
            data = {}
            if filename.endswith('.xlsx') or filename.endswith('.xls'):
                data = self.parse_excel(file_obj)
            elif filename.endswith('.pdf'):
                data = self.parse_pdf(file_obj)
            elif filename.endswith('.docx') or filename.endswith('.doc'):
                data = self.parse_word(file_obj)
            else:
                return Response({"error": "Unsupported file format"}, status=400)

            return Response(data, status=200)
        except Exception as e:
            print(f"Parsing Error: {e}")
            import traceback
            traceback.print_exc()
            return Response({"error": f"Failed to parse file: {str(e)}"}, status=400)

    def parse_excel(self, file_obj):
        import pandas as pd
        
        # Load all sheets or just the first one
        df = pd.read_excel(file_obj, header=None)
        
        # --- Common Containers ---
        metadata = {}
        courses = []
        grid_data = [['' for _ in range(7)] for _ in range(6)] 
        college_name = ""
        doc_title = ""
        
        # 1. Metadata (Text Scan)
        top_rows = df.head(20).fillna("").astype(str)
        for idx, row in top_rows.iterrows():
            row_text = " ".join(row.values).lower()
            self._extract_metadata_from_text(row_text, metadata)
            if "college" in row_text and not college_name:
                for cell in row.values:
                    if "college" in cell.lower(): college_name = cell.strip().upper(); break
            if "time table" in row_text: doc_title = "TIME TABLE"

        # 2. Courses (Header Search)
        course_start_idx = -1
        course_cols = {}
        for idx, row in df.fillna("").astype(str).iterrows():
            row_vals = [x.lower().strip() for x in row.values]
            if "code" in row_vals and ("title" in row_vals or "name" in row_vals):
                course_start_idx = idx
                for c_i, val in enumerate(row_vals):
                    if "code" in val: course_cols['code'] = c_i
                    if "title" in val or "name" in val: course_cols['name'] = c_i
                    if "faculty" in val or "staff" in val: course_cols['faculty'] = c_i
                    if "acronym" in val or "abbr" in val: course_cols['acronym'] = c_i
                break
        
        if course_start_idx != -1:
            for idx in range(course_start_idx + 1, len(df)):
                row = df.iloc[idx].fillna("").astype(str).values
                code = row[course_cols['code']].strip() if 'code' in course_cols else ""
                if not code or "total" in code.lower(): break
                courses.append({
                    "id": str(len(courses) + 1),
                    "code": code,
                    "name": row[course_cols['name']].strip() if 'name' in course_cols else "",
                    "faculty": row[course_cols['faculty']].strip() if 'faculty' in course_cols else "",
                    "acronym": row[course_cols['acronym']].strip() if 'acronym' in course_cols else code,
                    "periodsPerWeek": "0"
                })

        # 3. Grid (MON/TUE Search)
        grid_start_idx = -1
        day_col_idx = 0
        days_map = ["MON", "TUE", "WED", "THU", "FRI", "SAT"]
        
        for idx, row in df.fillna("").astype(str).iterrows():
            for c_i in range(3): 
                if c_i < len(row.values) and "MON" in row.values[c_i].upper():
                    grid_start_idx = idx; day_col_idx = c_i; break
            if grid_start_idx != -1: break
            
        if grid_start_idx != -1:
            for d_i, day_name in enumerate(days_map):
                curr_row = grid_start_idx + d_i
                if curr_row >= len(df): break
                row_vals = df.iloc[curr_row].fillna("").astype(str).values
                candidates = row_vals[day_col_idx+1:]
                self._fill_grid_row(grid_data, d_i, candidates)

        return { "metadata": metadata, "courses": courses, "gridData": grid_data, "collegeName": college_name, "docTitle": doc_title }

    def parse_pdf(self, file_obj):
        import pdfplumber
        
        metadata = {}
        courses = []
        grid_data = [['' for _ in range(7)] for _ in range(6)]
        college_name = "" 
        doc_title = ""

        with pdfplumber.open(file_obj) as pdf:
            first_page = pdf.pages[0]
            text = first_page.extract_text()
            
            # Metadata
            if text:
                lines = text.split('\n')
                for line in lines:
                    self._extract_metadata_from_text(line.lower(), metadata)
                    if "college" in line.lower() and not college_name: college_name = line.strip().upper()
                    if "time table" in line.lower(): doc_title = "TIME TABLE"

            # Tables
            tables = first_page.extract_tables()
            
            # Heuristic: Find which table is which
            # Grid table usually has "MON", "TUE" in first column
            # Course table usually has "Code", "Title" in headers
            
            for table in tables:
                if not table: continue
                
                # Check Header
                header = [str(x).lower() for x in table[0] if x]
                
                # Is Course Table?
                if any("code" in x for x in header) and any("title" in x or "name" in x for x in header):
                    # Parse Courses
                    # Assume column mapping based on standard order if headers not perfect
                    # Simple map: Code, Title, Faculty
                    c_idx = next((i for i, x in enumerate(header) if "code" in x), 0)
                    t_idx = next((i for i, x in enumerate(header) if "title" in x or "name" in x), 1)
                    f_idx = next((i for i, x in enumerate(header) if "faculty" in x or "staff" in x), 2)
                    
                    for row in table[1:]:
                        if not row or len(row) < 2: continue
                        code = row[c_idx] if c_idx < len(row) and row[c_idx] else ""
                        if not code or "total" in str(code).lower(): continue
                        
                        code = str(code).strip()
                        name = str(row[t_idx]).strip() if t_idx < len(row) and row[t_idx] else ""
                        faculty = str(row[f_idx]).strip() if f_idx < len(row) and row[f_idx] else ""
                        
                        courses.append({
                            "id": str(len(courses)+1),
                            "code": code,
                            "name": name,
                            "faculty": faculty,
                            "acronym": code, # PDF often doesn't have acronym column
                            "periodsPerWeek": "0"
                        })

                # Is Grid Table?
                # Check first Column for DAYS
                first_col = [str(row[0]).upper() for row in table if row and row[0]]
                if "MON" in first_col or "MONDAY" in first_col:
                    days_map = ["MON", "TUE", "WED", "THU", "FRI", "SAT"]
                    d_idx = 0
                    for row in table:
                        if not row: continue
                        first_cell = str(row[0]).upper().strip()
                        if any(x in first_cell for x in ["MON", "TUE", "WED", "THU", "FRI", "SAT"]):
                             # Found a day row
                             # Find index in map
                             matched_day_idx = -1
                             for i, d in enumerate(days_map):
                                 if d in first_cell: matched_day_idx = i; break
                             
                             if matched_day_idx != -1:
                                 # Fill Grid
                                 candidates = row[1:] # Skip day cell
                                 self._fill_grid_row(grid_data, matched_day_idx, candidates)

        return { "metadata": metadata, "courses": courses, "gridData": grid_data, "collegeName": college_name, "docTitle": doc_title }

    def parse_word(self, file_obj):
        import docx
        
        doc = docx.Document(file_obj)
        metadata = {}
        courses = []
        grid_data = [['' for _ in range(7)] for _ in range(6)]
        college_name = ""
        doc_title = ""

        # Metadata from Paragraphs
        for para in doc.paragraphs:
            text = para.text.lower()
            if text.strip():
                self._extract_metadata_from_text(text, metadata)
                if "college" in text and not college_name: college_name = para.text.strip().upper()
                if "time table" in text: doc_title = "TIME TABLE"

        # Tables
        for table in doc.tables:
            # Heuristic checks similar to PDF
            rows = table.rows
            if not rows: continue
            
            # Check Header
            header_cells = [cell.text.lower().strip() for cell in rows[0].cells]
            
            # Course Table?
            if any("code" in x for x in header_cells) and any("title" in x for x in header_cells):
                 c_idx = next((i for i, x in enumerate(header_cells) if "code" in x), 0)
                 t_idx = next((i for i, x in enumerate(header_cells) if "title" in x or "name" in x), 1)
                 f_idx = next((i for i, x in enumerate(header_cells) if "faculty" in x or "staff" in x), 2)

                 for row in rows[1:]:
                     cells = row.cells
                     code = cells[c_idx].text.strip() if c_idx < len(cells) else ""
                     if not code or "total" in code.lower(): continue
                     courses.append({
                         "id": str(len(courses)+1),
                         "code": code,
                         "name": cells[t_idx].text.strip() if t_idx < len(cells) else "",
                         "faculty": cells[f_idx].text.strip() if f_idx < len(cells) else "",
                         "acronym": code,
                         "periodsPerWeek": "0"
                     })
            
            # Grid Table?
            # Check first column of first few rows
            first_col_txt = [row.cells[0].text.upper().strip() for row in rows[:5] if row.cells]
            if any("MON" in x for x in first_col_txt):
                days_map = ["MON", "TUE", "WED", "THU", "FRI", "SAT"]
                for row in rows:
                    if not row.cells: continue
                    first_cell = row.cells[0].text.upper().strip()
                    matched_day_idx = -1
                    for i, d in enumerate(days_map):
                        if d in first_cell: matched_day_idx = i; break
                    
                    if matched_day_idx != -1:
                        candidates = [c.text for c in row.cells[1:]]
                        self._fill_grid_row(grid_data, matched_day_idx, candidates)

        return { "metadata": metadata, "courses": courses, "gridData": grid_data, "collegeName": college_name, "docTitle": doc_title }

    def _extract_metadata_from_text(self, text, metadata):
        import re
        if "academic year" in text:
            match = re.search(r'\d{4}\s*-\s*\d{4}', text)
            if match: metadata['academicYear'] = match.group(0)
        
        if "semester" in text:
             parts = text.split("semester")
             if len(parts) > 1:
                 # Clean up: " : V" -> "V"
                 val = parts[1].strip()
                 if val.startswith(":") or val.startswith("-"): val = val[1:].strip()
                 metadata['semester'] = val.upper()
        
        if "department" in text:
             parts = text.split("department")
             if len(parts) > 1:
                 val = parts[1].replace("of", "").strip()
                 if val.startswith(":") or val.startswith("-"): val = val[1:].strip()
                 metadata['department'] = val.upper()

    def _fill_grid_row(self, grid_data, row_idx, candidates):
        # Helper to fill periods
        p_filled = 0
        for val in candidates:
            # Handle None or non-string
            s_val = str(val).strip()
            if not s_val: continue
            if s_val.upper() in ["BREAK", "LUNCH", "B", "L"]: continue
            
            if p_filled < 7:
                grid_data[row_idx][p_filled] = s_val
                p_filled += 1
