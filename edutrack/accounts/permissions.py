# accounts/permissions.py
from rest_framework.permissions import BasePermission
# timetables/permissions.py
from rest_framework import permissions

class IsStaffOrAdmin(permissions.BasePermission):
    """
    Allow safe methods to everyone authenticated; create/update/delete only staff or admin.
    Assumes your User model has a 'role' attribute or 'is_staff' flag.
    Adjust checks to fit your project's user model.
    """
    def has_permission(self, request, view):
        # Allow GET/HEAD/OPTIONS to authenticated users (students too)
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # For write operations require staff or superuser:
        if not request.user or not request.user.is_authenticated:
            return False

        # adapt to your User model: either check `is_staff` or `role`
        if getattr(request.user, "is_superuser", False):
            return True
        if getattr(request.user, "is_staff", False):
            return True

        # If you have custom roles use: request.user.role == "staff" or "admin"
        role = getattr(request.user, "role", None)
        if role and role.lower() in ("staff", "admin"):
            return True

        return False


class IsAdmin(BasePermission):
    """Allow only users with role admin (case-insensitive)."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", "").lower() == "admin"
        )

class IsAdminOrStaff(BasePermission):
    """Allow users with role admin OR staff (case-insensitive)."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", "").lower() in ("admin", "staff")
        )

class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and getattr(request.user, "role", "").lower() == "student"

class IsStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and getattr(request.user, "role", "").lower() == "staff"

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and getattr(request.user, "role", "").lower() == "admin"
    
class IsStudent(BasePermission):
    """
    Allow only non-staff users (or those with student_profile).
    Adjust to your project logic: maybe you use groups/roles.
    """
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        # If you use a StudentProfile model:
        if hasattr(user, "student_profile"):
            return True
        # Fallback: treat non-is_staff as student
        return not user.is_staff

class IsStaffUser(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if hasattr(user, "staff_profile"):
            return True
        return user.is_staff