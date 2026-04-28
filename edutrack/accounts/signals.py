from django.db.models.signals import post_save
from django.dispatch import receiver
from accounts.models import User
from Staff_profile.models import StaffProfile

@receiver(post_save, sender=User)
def create_staff_profile(sender, instance, created, **kwargs):
    if created:
        if instance.role in [User.Roles.DEPT_STAFF, User.Roles.DEPT_ADMIN]:
            # Use getattr to safely check for department name
            dept_name = instance.department.name if instance.department else "General"
            
            # Use update_or_create to be safe against existing profiles
            StaffProfile.objects.get_or_create(
                user=instance,
                defaults={
                    "department": dept_name,
                    "designation": "HOD" if instance.role == User.Roles.DEPT_ADMIN else "Staff"
                }
            )
