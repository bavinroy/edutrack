import os
import django
import sys

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edutrack.settings')
django.setup()

from accounts.models import Student, User, Department, ClassAdvisor
from django.db.models import Q

def diagnose():
    print("--- Departments ---")
    for d in Department.objects.all():
        print(f"ID: {d.id}, Name: '{d.name}', Code: '{d.code}'")

    print("\n--- Class Advisors ---")
    advisors = ClassAdvisor.objects.all()
    for a in advisors:
        print(f"Advisor ID: {a.id}, Dept ID: {a.department_id} ({a.department.name}), Year: {a.year}, Section: '{a.section}'")
        staff_ids = []
        if a.advisor1: staff_ids.append(a.advisor1.username)
        if a.advisor2: staff_ids.append(a.advisor2.username)
        print(f"  Assigned Staff: {staff_ids}")

    print("\n--- Students (Year 4) ---")
    students = Student.objects.filter(year=4)
    for s in students:
        print(f"Student: {s.roll_no}, Name: {s.user.username if s.user else 'NoUser'}")
        print(f"  Dept FK: {s.department_id}, Year: {s.year}, Section: '{s.section}'")
        if s.user:
             print(f"  User Dept FK: {s.user.department_id}")
        else:
             print("  No User linked")

if __name__ == "__main__":
    diagnose()
