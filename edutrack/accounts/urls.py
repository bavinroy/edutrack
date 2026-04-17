from django.urls import path
from accounts.views import CustomTokenObtainPairView, whoami
from rest_framework_simplejwt.views import TokenRefreshView
from accounts import views
from accounts.views import DocumentUploadView,  DocumentDeleteView, DocumentListView
from accounts.views import TimeTableListCreateView, TimeTableRetrieveUpdateDestroyView, StudentTimeTableListView,StudentTimeTableDetailView, TimeTableListView, TimeTableDeleteView
from accounts.views import LetterListCreateView, LetterDetailView
from accounts.views import CreateRequestView, StudentRequestsListView, StaffRequestsListView,StaffActionView, AdminActionView, AdminRequestsListView
from accounts.views import NoticeCreateView, NoticeListView, NoticeDeleteView, NoticeAcknowledgeView, NoticeCommentView, NoticeCommentDeleteView, NoticeCommentEditView
from accounts.views import CreateDeptAdminView, CreateDeptStaffView, CreateDeptStudentView, BulkUploadUsersView
from accounts.views import DepartmentListCreateView, DepartmentDetailView

from accounts.views_notifications import NotificationListView, MarkNotificationReadView, MarkAllNotificationsReadView, RegisterPushTokenView

urlpatterns = [
    # Notifications
    path("notifications/", NotificationListView.as_view(), name="notifications-list"),
    path("notifications/<int:pk>/read/", MarkNotificationReadView.as_view(), name="notification-read"),
    path("notifications/read-all/", MarkAllNotificationsReadView.as_view(), name="notification-read-all"),
    path("notifications/push-token/", RegisterPushTokenView.as_view(), name="register-push-token"),

    # JWT Authentication
    path("login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("change-password/", views.ChangePasswordView.as_view(), name="change-password"),
    path("active-sessions/", views.ActiveSessionsView.as_view(), name="active-sessions"),

    path("documents/delete/<int:pk>/", DocumentDeleteView.as_view(), name="delete_document"),
    path("documents/upload/", DocumentUploadView.as_view(), name="upload_document"),  # staff
    path("documents/list/", DocumentListView.as_view(), name="list_documents"),
    path("timetables/parse/", views.ParseTimetableView.as_view(), name="timetable-parse"),
    path("timetables/", TimeTableListCreateView.as_view(), name="timetable-list-create"),
    path("timetables/<int:pk>/", TimeTableRetrieveUpdateDestroyView.as_view(), name="timetable-detail"),
    path("student/timetables/", StudentTimeTableListView.as_view(), name="student-timetable-list"),
    path("student/timetables/<int:pk>/", StudentTimeTableDetailView.as_view(), name="student-timetable-detail"),
    path("timetables/view/", TimeTableListView.as_view(), name="timetable-list"),
    path("timetables/<int:pk>/delete/", TimeTableDeleteView.as_view(), name="timetable-delete"),
    path("timetables/<int:pk>/publish/", views.TimeTablePublishView.as_view(), name="timetable-publish"),
    path("timetables/<int:pk>/verify/", views.TimeTableVerifyView.as_view(), name="timetable-verify"),
    path("timetables/pending/", views.DeptPendingTimeTableView.as_view(), name="timetable-pending"),
    
    path("letters/", LetterListCreateView.as_view(), name="letter-list-create"),
    path("letters/<int:pk>/", LetterDetailView.as_view(), name="letter-detail"),
    path("request/create/", CreateRequestView.as_view(), name="create-request"),
    path("request/student/", StudentRequestsListView.as_view(), name="student-requests"),
    
     # Staff
    path("request/staff/list/", StaffRequestsListView.as_view(), name="staff-requests-list"),
    path("request/staff/<int:pk>/", StaffActionView.as_view(), name="staff-action"),

    # Admin
    path("request/admin/list/", AdminRequestsListView.as_view(), name="admin-requests-list"),
    path("request/admin/<int:pk>/", AdminActionView.as_view(), name="admin-action"),

    # Principal
    path("request/principal/list/", views.PrincipalRequestsListView.as_view(), name="principal-requests-list"),
    path("request/principal/<int:pk>/", views.PrincipalActionView.as_view(), name="principal-action"),

    path("notice/list/", NoticeListView.as_view(), name="notice-list"),
    path("notice/create/", NoticeCreateView.as_view(), name="notice-create"),
    path("notice/<int:pk>/update/", views.NoticeUpdateView.as_view(), name="notice-update"),
    path("notice/<int:pk>/delete/", NoticeDeleteView.as_view(), name="notice-delete"),
    path("notice/<int:pk>/acknowledge/", NoticeAcknowledgeView.as_view(), name="notice-acknowledge"),
    path("notice/<int:pk>/comment/", NoticeCommentView.as_view(), name="notice-comment"),
    path("notice/comment/<int:pk>/delete/", NoticeCommentDeleteView.as_view(), name="notice-comment-delete"),
    path("notice/comment/<int:pk>/edit/", NoticeCommentEditView.as_view(), name="notice-comment-edit"),


    # optional:
    # path("requests/", AllRequestsListView.as_view(), name="requests_list"),
    # Whoami endpoint
    # User Creation & Bulk Upload
    path("create/dept-admin/", CreateDeptAdminView.as_view(), name="create-dept-admin"),
    path("create/dept-staff/", CreateDeptStaffView.as_view(), name="create-dept-staff"),
    path("create/dept-student/", CreateDeptStudentView.as_view(), name="create-dept-student"),
    path("bulk-upload/", BulkUploadUsersView.as_view(), name="bulk-upload-users"),
    path("user-creation-requests/list/", views.UserCreationRequestListView.as_view(), name="user-creation-request-list"),
    path("user-creation-requests/<int:pk>/action/", views.UserCreationRequestActionView.as_view(), name="user-creation-request-action"),
    path("user-creation-requests/<int:pk>/preview/", views.UserCreationRequestPreviewView.as_view(), name="user-creation-request-preview"),
    path("user-creation-requests/<int:pk>/delete/", views.UserCreationRequestDeleteView.as_view(), name="user-creation-request-delete"),
    path("user-creation-requests/clear/", views.UserCreationRequestClearView.as_view(), name="user-creation-request-clear"),
    path("departments/", DepartmentListCreateView.as_view(), name="department-list-create"),
    path("departments/<int:pk>/", DepartmentDetailView.as_view(), name="department-detail"),
    path("class-advisors/", views.ClassAdvisorListCreateView.as_view(), name="class-advisor-list-create"),
    path("class-advisors/<int:pk>/", views.ClassAdvisorRetrieveUpdateDestroyView.as_view(), name="class-advisor-detail"),
    path("department-staff/", views.DepartmentStaffListView.as_view(), name="department-staff-list"),
    path("department-admin/", views.DepartmentAdminListView.as_view(), name="department-admin-list"),
    path("department-student/", views.DepartmentStudentListView.as_view(), name="department-student-list"),
    path("student/class-advisors/", views.StudentClassAdvisorListView.as_view(), name="student-class-advisors"),

    path("student/dashboard/", views.student_dashboard, name="student-dashboard"),
    
    # Account Requests
    path("public/departments/", views.public_department_list, name="public-department-list"),
    path("account-request/submit/", views.create_account_request, name="account-request-submit"),
    path("account-request/list/", views.DeptAdminAccountRequestListView.as_view(), name="account-request-list"),
    path("account-request/<int:pk>/action/", views.DeptAdminAccountRequestActionView.as_view(), name="account-request-action"),

    path("whoami/", whoami, name="whoami"),
]

# --- Academic Router ---
from rest_framework.routers import DefaultRouter
from accounts import views_academic

router = DefaultRouter()
router.register(r'academic/subjects', views_academic.SubjectViewSet, basename='academic-subjects')
router.register(r'academic/students', views_academic.StudentViewSet, basename='academic-students')
router.register(r'academic/attendance', views_academic.AttendanceViewSet, basename='academic-attendance')
router.register(r'academic/class-advisors', views_academic.ClassAdvisorViewSet, basename='academic-class-advisors')
router.register(r'academic/timetables', views_academic.TimeTableViewSet, basename='academic-timetables')
router.register(r'academic/attendance-history', views_academic.AttendanceHistoryViewSet, basename='academic-attendance-history')

urlpatterns += [
    path("academic/schedule/my_schedule/", views_academic.StaffScheduleView.as_view(), name="my-schedule"),
    path("academic/schedule/upcoming/", views_academic.StaffUpcomingClassView.as_view(), name="upcoming-class"),
]

urlpatterns += router.urls
