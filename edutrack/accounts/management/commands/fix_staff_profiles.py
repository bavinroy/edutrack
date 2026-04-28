from django.core.management.base import BaseCommand
from accounts.models import User
from Staff_profile.models import StaffProfile

class Command(BaseCommand):
    help = 'Creates missing staff profiles for staff users'

    def handle(self, *args, **options):
        users = User.objects.filter(role__in=[User.Roles.DEPT_STAFF, User.Roles.DEPT_ADMIN])
        count = 0
        for u in users:
            obj, created = StaffProfile.objects.get_or_create(user=u)
            if created:
                count += 1
        self.stdout.write(self.style.SUCCESS(f'Created {count} missing staff profiles.'))
