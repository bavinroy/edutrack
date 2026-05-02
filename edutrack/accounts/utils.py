from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
import logging

logger = logging.getLogger(__name__)

def assign_role_permissions(user):
    """
    Helper to assign default permissions based on role.
    """
    from accounts.models import Student, Notice, Document, Letter, Request, Department, User
    from Staff_profile.models import StaffProfile

    if user.role == User.Roles.DEPT_ADMIN:
        # Full Management within department
        manage_models = [User, Student, Notice, Document, Letter, Request, StaffProfile]
        perms_to_add = []
        
        for model_cls in manage_models:
            ct = ContentType.objects.get_for_model(model_cls)
            p_list = Permission.objects.filter(content_type=ct, codename__in=[
                f'add_{model_cls._meta.model_name}',
                f'change_{model_cls._meta.model_name}',
                f'delete_{model_cls._meta.model_name}',
                f'view_{model_cls._meta.model_name}'
            ])
            perms_to_add.extend(list(p_list))
        
        user.user_permissions.add(*perms_to_add)
        logger.info(f"Assigned Dept Admin permissions to {user.username}")

    elif user.role == User.Roles.DEPT_STAFF:
        # Staff can manage Notices and Students (if assigned)
        manage_models = [Student, Notice, Document, Letter, Request]
        perms_to_add = []
        
        for model_cls in manage_models:
            ct = ContentType.objects.get_for_model(model_cls)
            # Staff can add/change but maybe not delete certain things? 
            # Giving them standard CRUD for now.
            p_list = Permission.objects.filter(content_type=ct, codename__in=[
                f'add_{model_cls._meta.model_name}',
                f'change_{model_cls._meta.model_name}',
                f'view_{model_cls._meta.model_name}'
            ])
            perms_to_add.extend(list(p_list))
            
        user.user_permissions.add(*perms_to_add)
        logger.info(f"Assigned Staff permissions to {user.username}")
