import os
import django
import sys

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edutrack.settings')
django.setup()

from accounts.models import Student, User, Department, ClassAdvisor
from django.db.models import Q

def check_data():
    print("--- Checking Students ---")
    students = Student.objects.all()
    for s in students:
        print(f"Student: {s.roll_no}, User Dept: {s.user.department}, Student Dept: {s.department}, Year: {s.year}")

    print("\n--- Checking Class Advisors ---")
    advisors = ClassAdvisor.objects.all()
    for a in advisors:
        print(f"Advisor: {a.id}, Dept: {a.department}, Year: {a.year}, Section: {a.section}")

if __name__ == "__main__":
    check_data()
