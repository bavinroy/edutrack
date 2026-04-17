import os
import django
import sys

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edutrack.settings')
django.setup()

from accounts.models import Student

def fix_students():
    print("--- Fixing Student Departments ---")
    students = Student.objects.all()
    count = 0
    updated_count = 0
    
    for s in students:
        count += 1
        if s.user and s.user.department:
            if s.department != s.user.department:
                print(f"Updating {s.roll_no}: {s.department} -> {s.user.department}")
                s.department = s.user.department
                s.save()
                updated_count += 1
            else:
                print(f"Skipping {s.roll_no}: Already correct ({s.department})")
        else:
            print(f"Skipping {s.roll_no}: No User or User Dept")

    print(f"\nTotal Students: {count}")
    print(f"Updated: {updated_count}")

if __name__ == "__main__":
    fix_students()
