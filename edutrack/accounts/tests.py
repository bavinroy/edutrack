from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User, Department, Student
from Staff_profile.models import StaffProfile

class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.dept = Department.objects.create(name="Computer Science")
        
        # Create a student user
        self.student_user = User.objects.create_user(
            username="student1",
            password="testpassword123",
            role=User.Roles.DEPT_STUDENT,
            department=self.dept
        )
        self.student_profile = Student.objects.create(
            user=self.student_user,
            department=self.dept,
            roll_no="CS101",
            year=1
        )

        # Create a staff user
        self.staff_user = User.objects.create_user(
            username="staff1",
            password="testpassword123",
            role=User.Roles.DEPT_STAFF,
            department=self.dept
        )

    def test_student_login(self):
        url = reverse('token_obtain_pair')
        response = self.client.post(url, {'username': 'student1', 'password': 'testpassword123'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_invalid_login(self):
        url = reverse('token_obtain_pair')
        response = self.client.post(url, {'username': 'student1', 'password': 'wrongpassword'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_student_dashboard_access(self):
        # First login to get token
        login_url = reverse('token_obtain_pair')
        login_res = self.client.post(login_url, {'username': 'student1', 'password': 'testpassword123'})
        token = login_res.data['access']
        
        # Access dashboard
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
        dashboard_url = reverse('student-dashboard')
        response = self.client.get(dashboard_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'student1')
        self.assertEqual(response.data['role'], User.Roles.DEPT_STUDENT)
        self.assertEqual(response.data['roll_no'], 'CS101')

    def test_badges_endpoint(self):
        login_url = reverse('token_obtain_pair')
        login_res = self.client.post(login_url, {'username': 'student1', 'password': 'testpassword123'})
        token = login_res.data['access']
        
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
        badges_url = reverse('user-badges')
        response = self.client.get(badges_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('notices', response.data)
        self.assertIn('requests', response.data)
        self.assertEqual(response.data['total'], 0)
