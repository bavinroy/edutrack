from django.urls import path
from . import views


urlpatterns = [
    # Student profile
    path("profile/", views.get_student_profile, name="get_student_profile"),
    path("profile/update/", views.update_student_profile, name="update_student_profile"),
    path("profile/change-password/", views.change_password, name="change_password"),
    # Admin/Staff actions
    path("admin/create-staff/", views.create_staff, name="create_staff"),   # ✅ only admin
    path("admin/create-student/", views.create_student, name="create_student"),  # ✅ admin + staff

     

]
