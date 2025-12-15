from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Department
from django import forms

class GroupedModelChoiceIterator(forms.models.ModelChoiceIterator):
    def __iter__(self):
        # Yield empty label if needed
        if self.field.empty_label is not None:
            yield ("", self.field.empty_label)
        
        # Group by category
        queryset = self.queryset
        # UG Group
        ug_qs = queryset.filter(category="UG")
        if ug_qs.exists():
            yield ("Under Graduate", [
                (obj.pk, str(obj)) for obj in ug_qs
            ])
        
        # PG Group
        pg_qs = queryset.filter(category="PG")
        if pg_qs.exists():
            yield ("Post Graduate", [
                (obj.pk, str(obj)) for obj in pg_qs
            ])
        
        # Others (if any)
        other_qs = queryset.exclude(category__in=["UG", "PG"])
        if other_qs.exists():
             yield ("Others", [
                (obj.pk, str(obj)) for obj in other_qs
            ])

class DepartmentChoiceField(forms.ModelChoiceField):
    def _get_choices(self):
        if hasattr(self, '_choices'):
            return self._choices
        return GroupedModelChoiceIterator(self)
    
    choices = property(_get_choices, forms.ModelChoiceField.choices.fset)

class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'category')
    list_filter = ('category',)

admin.site.register(Department, DepartmentAdmin)

class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ("username", "email", "role", "department", "is_staff", "is_superuser")
    list_filter = ("role", "department", "is_staff", "is_superuser")
    fieldsets = (
        (None, {"fields": ("username", "email", "password", "role", "department")}),
        ("Permissions", {"fields": ("is_staff", "is_superuser", "groups", "user_permissions")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("username", "email", "role", "department", "password1", "password2", "is_staff", "is_superuser")}
        ),
    )
    search_fields = ("username", "email")
    ordering = ("username",)

    def get_fieldsets(self, request, obj=None):
        import copy
        # use deepcopy to avoid mutating the class-level fieldsets attribute which would affect other users/requests
        fieldsets = copy.deepcopy(super().get_fieldsets(request, obj))
        
        if request.user.is_authenticated:
            # For Dept Admin: Hide Superuser only
            if request.user.role == User.Roles.DEPT_ADMIN:
                for section in fieldsets:
                    fields = list(section[1]['fields'])
                    if 'is_superuser' in fields:
                        fields.remove('is_superuser')
                    if 'user_permissions' in fields:
                         # Ensure these are visible (logic check)
                         pass
                    section[1]['fields'] = tuple(fields)
            
            # For Dept Staff: Hide ENTIRE Permissions section/fields
            elif request.user.role == User.Roles.DEPT_STAFF:
                for section in fieldsets:
                    fields = list(section[1]['fields'])
                    # Remove all permission related fields
                    if 'is_superuser' in fields: fields.remove('is_superuser')
                    if 'is_staff' in fields: fields.remove('is_staff') 
                    if 'groups' in fields: fields.remove('groups')
                    if 'user_permissions' in fields: fields.remove('user_permissions')
                    section[1]['fields'] = tuple(fields)
                
                # Also remove empty "Permissions" section if it exists (or any section that became empty)
                fieldsets = [fs for fs in fieldsets if fs[1]['fields']]
        
        return fieldsets

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "department":
             return DepartmentChoiceField(queryset=Department.objects.all())
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        # If user is a Dept Admin, restrict department choice to their own department
        # If user is a Dept Admin, restrict choices
        if request.user.is_authenticated and request.user.role == User.Roles.DEPT_ADMIN:
             # Lock department field to their own
             if 'department' in form.base_fields:
                form.base_fields['department'].queryset = form.base_fields['department'].queryset.filter(id=request.user.department_id)
                form.base_fields['department'].initial = request.user.department
                form.base_fields['department'].disabled = True # Prevent changing
             
             # Restrict Role choices to only Dept Staff and Dept Student
             if 'role' in form.base_fields:
                 allowed_roles = [User.Roles.DEPT_STAFF, User.Roles.DEPT_STUDENT]
                 form.base_fields['role'].choices = [
                     c for c in User.Roles.choices if c[0] in allowed_roles
                 ]
        # If user is a Dept Staff, restrict strict logic
        if request.user.is_authenticated and request.user.role == User.Roles.DEPT_STAFF:
             # Lock department field to their own
             if 'department' in form.base_fields:
                form.base_fields['department'].queryset = form.base_fields['department'].queryset.filter(id=request.user.department_id)
                form.base_fields['department'].initial = request.user.department
                form.base_fields['department'].disabled = True # Prevent changing

             # Restrict Role choices to only Dept Student
             if 'role' in form.base_fields:
                 allowed_roles = [User.Roles.DEPT_STUDENT]
                 form.base_fields['role'].choices = [
                     c for c in User.Roles.choices if c[0] in allowed_roles
                 ]
        return form

    def save_model(self, request, obj, form, change):
        # If Dept Admin or Staff is saving, force the department to be their own
        if request.user.role in [User.Roles.DEPT_ADMIN, User.Roles.DEPT_STAFF]:
            obj.department = request.user.department
        
        super().save_model(request, obj, form, change)
        
        # If the saved user is a DEPT_ADMIN, ensure they have extensive permissions
        if obj.role == User.Roles.DEPT_ADMIN:
            from django.contrib.auth.models import Permission
            from django.contrib.contenttypes.models import ContentType
            from .models import Student, Notice, Document, Letter, Request, Department
            
            # List of models to grant full management access (Add, Change, Delete, View)
            manage_models = [User, Student, Notice, Document, Letter, Request]
            
            perms_to_add = []
            
            # Grant full access to manage models
            for model_cls in manage_models:
                ct = ContentType.objects.get_for_model(model_cls)
                p_list = Permission.objects.filter(content_type=ct, codename__in=[
                    f'add_{model_cls._meta.model_name}',
                    f'change_{model_cls._meta.model_name}',
                    f'delete_{model_cls._meta.model_name}',
                    f'view_{model_cls._meta.model_name}'
                ])
                perms_to_add.extend(p_list)

            # Grant View-Only access to Department
            dept_ct = ContentType.objects.get_for_model(Department)
            perms_to_add.extend(Permission.objects.filter(content_type=dept_ct, codename='view_department'))

            obj.user_permissions.add(*perms_to_add)

        # If the saved user is a DEPT_STAFF, grant default permissions to manage Students
        elif obj.role == User.Roles.DEPT_STAFF:
             from django.contrib.auth.models import Permission
             from django.contrib.contenttypes.models import ContentType
             from .models import Student

             # Grant full management access to Student model
             student_ct = ContentType.objects.get_for_model(Student)
             student_perms = Permission.objects.filter(content_type=student_ct, codename__in=[
                 'add_student',
                 'change_student',
                 'delete_student', # Maybe debatable, but user said "all dept student related permission"
                 'view_student'
             ])
             
             # Also allow creating users (since Student has a OneToOne user)? 
             # Usually "creating a student" implies creating a User account too.
             user_ct = ContentType.objects.get_for_model(User)
             user_perms = Permission.objects.filter(content_type=user_ct, codename__in=[
                 'add_user',
                 'change_user',
                 'view_user'
             ])

             obj.user_permissions.add(*student_perms)
             obj.user_permissions.add(*user_perms)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        # If Dept Admin, only show users in their department
        if request.user.role == User.Roles.DEPT_ADMIN:
            return qs.filter(department=request.user.department)
        
        # If Dept Staff, only show STUDENTS in their department
        if request.user.role == User.Roles.DEPT_STAFF:
            return qs.filter(department=request.user.department, role=User.Roles.DEPT_STUDENT)
            
        return qs

admin.site.register(User, CustomUserAdmin)
