from django.db import models
from django.conf import settings

def staff_avatar_upload_path(instance, filename):
    return f"staff_avatars/{instance.user.id}/{filename}"

class StaffProfile(models.Model):
    # Link to custom user model (AUTH_USER_MODEL)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="staff_profile",
        null=True,
        blank=True
    )
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    department = models.CharField(max_length=50, blank=True, null=True)
    designation = models.CharField(max_length=50, blank=True, null=True)
    date_joined = models.DateField(auto_now_add=True)
    avatar = models.ImageField(upload_to=staff_avatar_upload_path, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} Profile" if self.user else "Unlinked Staff Profile"
