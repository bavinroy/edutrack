# staff_profile/urls.py
from django.urls import path
from . import views
from .views import StaffProfileListView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Staff profile
    path("profile/", views.get_staff_profile, name="get_staff_profile"),
    path("profile/update/", views.update_staff_profile, name="update_staff_profile"),
    path("profile/change-password/", views.change_staff_password, name="change_staff_password"),
    path("profile/<int:user_id>/", views.StaffProfileDetailView.as_view(), name="staff-profile-detail"),
    path("list/", StaffProfileListView.as_view(), name="staff-list"),

    # Admin action to create staff users
    path("create-user/", views.create_staff_user, name="create_staff_user"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
