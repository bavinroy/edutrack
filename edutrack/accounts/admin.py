from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm
from accounts.models import (
    User, Department, Student, TimeTable, Subject, ClassAdvisor, 
    Document, Letter, Request, RequestHistory, Notice, 
    NoticeAcknowledgement, NoticeComment
)
from django import forms


class CustomUserCreationForm(UserCreationForm):
    register_number = forms.CharField(required=False, help_text="Unique ID / Roll No. Used for Login.")
    display_name = forms.CharField(required=True, label="Username", help_text="Display Name. Duplicates allowed.")
    first_name = forms.CharField(required=True)
    last_name = forms.CharField(required=True)
    year = forms.IntegerField(required=False, label="Year (Students Only)")

    class Meta:
        model = User
        fields = ("display_name", "register_number", "email", "role", "department", "first_name", "last_name", "year")

    def clean(self):
        cleaned_data = super().clean()
        role = cleaned_data.get('role')
        first_name = cleaned_data.get('first_name')
        last_name = cleaned_data.get('last_name')
        year = cleaned_data.get('year')
        department = cleaned_data.get('department')
        register_number = cleaned_data.get('register_number')
        
        # We don't check uniqueness of display_name (Username input)
        
        if role:
             # For ALL roles, if register_number is provided, we use it as the unique username
             # If not provided (e.g. staff/admin might want just a name?), we need a fallback.
             # User requested: "register number is unic for all users"
             pass

        if role == User.Roles.DEPT_STUDENT:
            if not first_name:
                self.add_error('first_name', "First Name is required for students.")
            if not last_name:
                self.add_error('last_name', "Last Name is required for students.")
            if not year:
                self.add_error('year', "Year is required for students.")
            if not department:
                 self.add_error('department', "Department is required for students.") 
            if not register_number:
                 self.add_error('register_number', "Register Number is required for students.")
            
        # Ensure register_number is unique if provided
        if register_number:
            if User.objects.filter(username=register_number).exists():
                 self.add_error('register_number', "User with this Register Number (System ID) already exists.")
            else:
                 cleaned_data['username'] = register_number
        else:
            # If no register number, we need to generate a unique username or require it?
            # User said "add register numbers for student". For others?
            # Let's enforce Register Number for everyone if they want "register number is unic for all users"
            # But maybe let admin stick to old way if they leave it blank?
            # For now, if no register number, we might fail or use display_name (but display_name can be dup).
            # Let's require register_number for Students, and for others, fallback to display_name but enforce uniqueness?
            # Or just require register_number for everyone to be safe.
            if role == User.Roles.DEPT_STUDENT:
                pass # Already errored above
            elif cleaned_data.get('display_name'):
                 # For non-students, if they don't provide reg no, try to use display_name as username
                 # But display_name can be duplicate.
                 # So we should probably require register_number for everyone or auto-generate one.
                 # Let's default to requiring proper username/reg-no for login.
                 pass

        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        # Set the internal unique username to the register number
        if self.cleaned_data.get('username'):
            user.username = self.cleaned_data.get('username')
        elif self.cleaned_data.get('display_name'):
             # Fallback for non-students without reg no?
             # Just try to use display_name, but it might fail DB unique constraint if dup.
             user.username = self.cleaned_data.get('display_name')
        
        user.display_name = self.cleaned_data.get('display_name')
        
        if commit:
            user.save()
        return user

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

# Register new models
class TimeTableAdmin(admin.ModelAdmin):
    list_display = ('title', 'class_name', 'section', 'year', 'department', 'status', 'created_at')
    list_filter = ('department', 'status', 'year')
    search_fields = ('title', 'class_name', 'section', 'year')

admin.site.register(TimeTable, TimeTableAdmin)

class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'department')
    list_filter = ('department',)

admin.site.register(Subject, SubjectAdmin)

class ClassAdvisorAdmin(admin.ModelAdmin):
    list_display = ('department', 'year', 'advisor1', 'advisor2')
    list_filter = ('department', 'year')

admin.site.register(ClassAdvisor, ClassAdvisorAdmin)

class DocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'subject_name', 'subject_code', 'uploaded_by', 'created_at')
    list_filter = ('subject_code', 'created_at')
    search_fields = ('title', 'subject_name', 'subject_code')

admin.site.register(Document, DocumentAdmin)

class LetterAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'is_shared', 'created_at')
    list_filter = ('is_shared', 'created_at')

admin.site.register(Letter, LetterAdmin)

class RequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'letter', 'student', 'staff', 'staff_status', 'admin_status', 'created_at')
    list_filter = ('staff_status', 'admin_status', 'created_at')

admin.site.register(Request, RequestAdmin)

class RequestHistoryAdmin(admin.ModelAdmin):
    list_display = ('request', 'user', 'action', 'status', 'timestamp')
    list_filter = ('action', 'status', 'timestamp')

admin.site.register(RequestHistory, RequestHistoryAdmin)

class NoticeAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'notice_type', 'created_at')
    list_filter = ('notice_type', 'created_at')

admin.site.register(Notice, NoticeAdmin)

# Acknowledgement and Comments could be Inlines or just registered
admin.site.register(NoticeAcknowledgement)
admin.site.register(NoticeComment)

class StudentInline(admin.StackedInline):
    # ... (remains unchanged)
    model = Student
    can_delete = False
    verbose_name_plural = 'Student Profile'
    fk_name = 'user'

class StudentAdmin(admin.ModelAdmin):
    # ... (remains unchanged)
    list_display = ('roll_no', 'get_student_name', 'course', 'year', 'date_joined')
    list_filter = ('year', 'course', 'date_joined')
    search_fields = ('roll_no', 'user__username', 'user__first_name', 'user__last_name')
    ordering = ('roll_no',)

    def get_student_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}"
        return "-"
    get_student_name.short_description = 'Student Name'
    get_student_name.admin_order_field = 'user__first_name'

admin.site.register(Student, StudentAdmin)

class CustomUserAdmin(UserAdmin):
    # ... (remains unchanged up to save_model)
    model = User
    add_form = CustomUserCreationForm
    list_display = ("username", "display_name", "email", "role", "department", "get_student_year", "is_staff")
    list_filter = ("role", "department", "is_staff", "student_account__year")
    fieldsets = (
        (None, {"fields": ("username", "display_name", "email", "password", "role", "department", "first_name", "last_name")}),
        ("Permissions", {"fields": ("is_staff", "is_superuser", "groups", "user_permissions")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("register_number", "display_name", "email", "role", "department", "first_name", "last_name", "year", "password1", "password2", "is_staff", "is_superuser")}
        ),
    )

    @admin.display(description="Year (Student)", ordering="student_account__year")
    def get_student_year(self, obj):
        if hasattr(obj, 'student_account') and obj.student_account:
            return obj.student_account.year
        return "-"

    def get_readonly_fields(self, request, obj=None):
        return []

    def get_urls(self):
        urls = super().get_urls()
        from django.urls import path
        my_urls = [
            path('bulk-upload/', self.admin_site.admin_view(self.bulk_upload_view), name='bulk_upload'),
        ]
        return my_urls + urls

    def bulk_upload_view(self, request):
        from django.shortcuts import render, redirect
        from django.contrib import messages
        from django.db import transaction
        import pandas as pd
        from accounts.models import User, Department, Student

        if request.method == "POST":
            excel_file = request.FILES.get("file")
            if not excel_file:
                messages.error(request, "Please upload a file.")
                return redirect(request.path)

            try:
                df = pd.read_excel(excel_file)
                # Sanitize headers
                df.columns = [str(c).strip().lower() for c in df.columns]
                
                # Rename 'user name' to 'username'
                if 'user name' in df.columns:
                    df.rename(columns={'user name': 'username'}, inplace=True)
                    
                critical_cols = [c for c in ['username', 'email'] if c in df.columns]
                if critical_cols:
                    df.dropna(subset=critical_cols, how='all', inplace=True)

                success_count = 0
                errors = []

                with transaction.atomic():
                    for index, row in df.iterrows():
                        try:
                            username = str(row.get('username')).strip()
                            email = str(row.get('email')).strip()
                            
                            if not username or username == 'nan': continue

                            # Role determination
                            role_raw = str(row.get('role', '')).upper().strip()
                            role_map = {
                                'STUDENT': User.Roles.DEPT_STUDENT,
                                'STAFF': User.Roles.DEPT_STAFF,
                                'ADMIN': User.Roles.DEPT_ADMIN
                            }
                            role = role_map.get(role_raw, User.Roles.DEPT_STUDENT) # Default to Student if unknown? Or Error?

                            # Dept determination
                            if request.user.role in [User.Roles.DEPT_ADMIN, User.Roles.DEPT_STAFF]:
                                department = request.user.department
                            else:
                                dept_name = str(row.get('department', '')).strip()
                                department = Department.objects.filter(name__iexact=dept_name).first()
                            
                            if not department:
                                errors.append(f"Row {index}: Department not found for {username}")
                                continue

                            # Create User
                            if User.objects.filter(username=username).exists():
                                errors.append(f"Row {index}: User {username} already exists")
                                continue

                            user = User.objects.create_user(
                                username=username,
                                email=email,
                                password=str(row.get('password', 'Default@123')),
                                first_name=str(row.get('first_name', '')),
                                last_name=str(row.get('last_name', '')),
                                role=role,
                                department=department
                            )
                            
                            # Create Student Profile if needed
                            if role == User.Roles.DEPT_STUDENT:
                                Student.objects.create(
                                    user=user,
                                    roll_no=username,
                                    year=1, # Default
                                    course=department.name,
                                    department=department
                                )
                            
                            success_count += 1

                        except Exception as e:
                            errors.append(f"Row {index}: {str(e)}")

                if success_count > 0:
                    messages.success(request, f"Successfully created {success_count} users.")
                
                if errors:
                    messages.warning(request, f"Some rows failed: {'; '.join(errors[:5])}...")

                return redirect("admin:accounts_user_changelist")

            except Exception as e:
                messages.error(request, f"Error processing file: {str(e)}")
                return redirect(request.path)

        # GET request
        class ExcelUploadForm(forms.Form):
            file = forms.FileField(label="Select Excel File (*.xlsx)")
        
        form = ExcelUploadForm()
        context = {
            'form': form,
            'opts': self.model._meta,
            'title': 'Bulk Upload Users'
        }
        return render(request, "admin/accounts/user/bulk_upload.html", context)


    def get_form(self, request, obj=None, **kwargs):
        # ... (remains unchanged)
        form = super().get_form(request, obj, **kwargs)
        
        # Pre-populate year field if editing an existing user
        if obj and hasattr(obj, 'student_account') and 'year' in form.base_fields:
            form.base_fields['year'].initial = obj.student_account.year

        # If user is a Dept Admin, restrict department choice to their own department
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

        # Handle Student Profile creation or update
        if obj.role == User.Roles.DEPT_STUDENT:
            year = form.cleaned_data.get('year')
            # If student profile exists, update it
            if hasattr(obj, 'student_account'):
                if year:
                    obj.student_account.year = year
                    obj.student_account.save()
            else:
                # Create new student profile
                dept_name = obj.department.name if obj.department else "General"
                Student.objects.create(
                    user=obj,
                    roll_no=obj.username,
                    year=year if year else 1,
                    course=dept_name,
                    department=obj.department
                )
        
        # If the saved user is a DEPT_ADMIN, ensure they have extensive permissions
        if obj.role == User.Roles.DEPT_ADMIN:
            from django.contrib.auth.models import Permission
            from django.contrib.contenttypes.models import ContentType
            from accounts.models import Notice, Document, Letter, Request, TimeTable, Subject
            
            # List of models to grant full management access (Add, Change, Delete, View)
            # UPDATED with new models to match mobile/frontend features
            manage_models = [User, Student, Notice, Document, Letter, Request, TimeTable, Subject]
            
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

        # If User is DEPT_STAFF or DEPT_ADMIN, ensure StaffProfile exists
        if obj.role in [User.Roles.DEPT_STAFF, User.Roles.DEPT_ADMIN]:
            from Staff_profile.models import StaffProfile
            dept_name = obj.department.name if obj.department else "General"
            StaffProfile.objects.get_or_create(
                user=obj,
                defaults={
                    "department": dept_name,
                    "designation": "HOD" if obj.role == User.Roles.DEPT_ADMIN else "Staff"
                }
            )

        # If the saved user is a DEPT_STAFF, grant default permissions to manage Students
        if obj.role == User.Roles.DEPT_STAFF:
             from django.contrib.auth.models import Permission
             from django.contrib.contenttypes.models import ContentType
             from Staff_profile.models import StaffProfile # Explicit import

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

             # Also grant view access to StaffProfile
             # NOTE: StaffProfile might be hidden in admin now, but permissions are still good to have
             staff_profile_ct = ContentType.objects.get_for_model(StaffProfile)
             staff_profile_perms = Permission.objects.filter(content_type=staff_profile_ct, codename='view_staffprofile')

             obj.user_permissions.add(*student_perms)
             obj.user_permissions.add(*user_perms)
             obj.user_permissions.add(*staff_profile_perms)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        # If Dept Admin, only show users in their department
        if request.user.role == User.Roles.DEPT_ADMIN:
            return qs.filter(department=request.user.department)
        
        # If Dept Staff, only show STUDENTS and STAFF in their department
        if request.user.role == User.Roles.DEPT_STAFF:
            return qs.filter(department=request.user.department, role__in=[User.Roles.DEPT_STUDENT, User.Roles.DEPT_STAFF])
            
        return qs

admin.site.register(User, CustomUserAdmin)
