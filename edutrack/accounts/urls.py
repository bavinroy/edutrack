from django.urls import path
from .views import CustomTokenObtainPairView, whoami
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from .views import DocumentUploadView,  DocumentDeleteView, DocumentListView
from .views import TimeTableListCreateView, TimeTableRetrieveUpdateDestroyView, StudentTimeTableListView,StudentTimeTableDetailView, TimeTableListView, TimeTableDeleteView
from .views import LetterListCreateView, LetterDetailView
from .views import CreateRequestView, StudentRequestsListView, StaffRequestsListView,StaffActionView, AdminActionView, AdminRequestsListView
from .views import NoticeCreateView, NoticeListView, NoticeDeleteView, NoticeAcknowledgeView, NoticeCommentView, NoticeCommentDeleteView, NoticeCommentEditView

urlpatterns = [
    # JWT Authentication
    path("login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    path("documents/delete/<int:pk>/", DocumentDeleteView.as_view(), name="delete_document"),
    path("documents/upload/", DocumentUploadView.as_view(), name="upload_document"),  # staff
    path("documents/list/", DocumentListView.as_view(), name="list_documents"),
    path("timetables/", TimeTableListCreateView.as_view(), name="timetable-list-create"),
    path("timetables/<int:pk>/", TimeTableRetrieveUpdateDestroyView.as_view(), name="timetable-detail"),
    path("student/timetables/", StudentTimeTableListView.as_view(), name="student-timetable-list"),
    path("student/timetables/<int:pk>/", StudentTimeTableDetailView.as_view(), name="student-timetable-detail"),
    path("timetables/view/", TimeTableListView.as_view(), name="timetable-list"),
    path("timetables/<int:pk>/delete/", TimeTableDeleteView.as_view(), name="timetable-delete"),
    
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

    path("notice/list/", NoticeListView.as_view(), name="notice-list"),
    path("notice/create/", NoticeCreateView.as_view(), name="notice-create"),
    path("notice/<int:pk>/delete/", NoticeDeleteView.as_view(), name="notice-delete"),
    path("notice/<int:pk>/acknowledge/", NoticeAcknowledgeView.as_view(), name="notice-acknowledge"),
    path("notice/<int:pk>/comment/", NoticeCommentView.as_view(), name="notice-comment"),
    path("notice/comment/<int:pk>/delete/", NoticeCommentDeleteView.as_view(), name="notice-comment-delete"),
    path("notice/comment/<int:pk>/edit/", NoticeCommentEditView.as_view(), name="notice-comment-edit"),


    # optional:
    # path("requests/", AllRequestsListView.as_view(), name="requests_list"),
    # Whoami endpoint
    path("whoami/", whoami, name="whoami"),
]
