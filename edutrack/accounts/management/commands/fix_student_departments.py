from django.core.management.base import BaseCommand
from accounts.models import Student

class Command(BaseCommand):
    help = 'Fixes student departments by aligning them with their user object department'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("--- Fixing Student Departments ---"))
        students = Student.objects.all()
        count = 0
        updated_count = 0
        
        for s in students:
            count += 1
            if s.user and s.user.department:
                if s.department != s.user.department:
                    self.stdout.write(f"Updating {s.roll_no}: {s.department} -> {s.user.department}")
                    s.department = s.user.department
                    s.save()
                    updated_count += 1
                else:
                    self.stdout.write(f"Skipping {s.roll_no}: Already correct ({s.department})")
            else:
                self.stdout.write(self.style.WARNING(f"Skipping {s.roll_no}: No User or User Dept"))

        self.stdout.write(self.style.SUCCESS(f"\nTotal Students: {count}"))
        self.stdout.write(self.style.SUCCESS(f"Updated: {updated_count}"))
