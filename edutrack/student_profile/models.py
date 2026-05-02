from django.db import models
from django.conf import settings


def avatar_upload_path(instance, filename):
    return f"avatars/{instance.user.id}/{filename}"


class StudentProfile(models.Model):
    # Link to custom user model (AUTH_USER_MODEL)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="student_profile",
        null=True,
        blank=True
    )
    roll_number = models.CharField(max_length=50, unique=True)  # Unique roll number
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    course = models.CharField(max_length=100, blank=True, null=True)
    year = models.IntegerField(blank=True, null=True)
    avatar = models.ImageField(upload_to=avatar_upload_path, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} Profile" if self.user else "Unlinked Profile"


class Feedback(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="feedbacks")
    subject = models.CharField(max_length=200)
    message = models.TextField()
    category = models.CharField(max_length=50, default="General") # Suggestion, Bug, Other
    created_at = models.DateTimeField(auto_now_add=True)
    is_resolved = models.BooleanField(default=False)

    def __str__(self):
        return f"Feedback: {self.subject} by {self.user.username}"

