from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):
    """
    Allows access only to superuser or SUPER_ADMIN role.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_superuser or 
            getattr(request.user, 'role', '') == 'SUPER_ADMIN'
        )

class IsPrincipal(permissions.BasePermission):
    """
    Allows access to Principal.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and getattr(request.user, 'role', '') == 'PRINCIPAL'

class IsDepartmentAdmin(permissions.BasePermission):
    """
    Allows access to Dept Admin.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and getattr(request.user, 'role', '') == 'DEPT_ADMIN'

    def has_object_permission(self, request, view, obj):
        # Super admin bypass
        if request.user.is_superuser: return True
        
        # Check department match
        user_dept = getattr(request.user, 'department', None)
        if not user_dept: return False

        # Try to find department on object
        obj_dept = getattr(obj, 'department', None)
        
        # If object is a User or has a user field, check that user's department
        if hasattr(obj, 'user') and hasattr(obj.user, 'department'):
             obj_dept = obj.user.department
        elif isinstance(obj, type(request.user)): # If obj IS a User
             obj_dept = obj.department
        
        # If obj IS a Department (check by class name or duck typing)
        if obj.__class__.__name__ == 'Department':
             return obj == user_dept

        return obj_dept == user_dept

class IsDepartmentStaff(permissions.BasePermission):
    """
    Allows access to Dept Staff.
    """
    def has_permission(self, request, view):
         return request.user and request.user.is_authenticated and getattr(request.user, 'role', '') == 'DEPT_STAFF'

    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser: return True
        
        user_dept = getattr(request.user, 'department', None)
        if not user_dept: return False

        obj_dept = getattr(obj, 'department', None)
        if hasattr(obj, 'user') and hasattr(obj.user, 'department'):
             obj_dept = obj.user.department
        elif isinstance(obj, type(request.user)):
             obj_dept = obj.department
             
        return obj_dept == user_dept

# --- Grouped Permissions ---

class IsAdmin(permissions.BasePermission):
    """ Checks if user is any type of Admin (System, Super, Principal) """
    def has_permission(self, request, view):
        # 0 Caution: Allow any authenticated user
        return request.user and request.user.is_authenticated

class IsStaff(permissions.BasePermission):
    """ Any Staff Member (Global, Dept, or Admin acting as Staff) """
    def has_permission(self, request, view):
        # 0 Caution: Allow any authenticated user
        return request.user and request.user.is_authenticated

class IsStudent(permissions.BasePermission):
    """ Any Student """
    def has_permission(self, request, view):
        # 0 Caution: Allow any authenticated user
        return request.user and request.user.is_authenticated

class IsStaffOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        # 0 Caution: Allow any authenticated user
        return request.user and request.user.is_authenticated