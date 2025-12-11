from rest_framework import serializers
from .models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Student
from .models import Department, Subject
from .models import Document
from .models import TimeTable
from rest_framework import serializers
from .models import Letter
from .models import  Request, RequestHistory
from .models import Notice, NoticeAcknowledgement, NoticeComment

class TimeTableSerializer(serializers.ModelSerializer):
    # Show the username/email of the staff who created the timetable (read-only)
    created_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = TimeTable
        fields = [
            "id",
            "title",
            "class_name",
            "section",
            "year",
            "grid",          # JSON field with timetable data
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_by", "created_at", "updated_at"]

    def create(self, validated_data):
        """
        Automatically assign the logged-in staff user as created_by.
        """
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["created_by"] = request.user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """
        Allow updating only the timetable fields, not the creator.
        """
        validated_data.pop("created_by", None)
        return super().update(instance, validated_data)




class SimpleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

# --- Student Serializer ---
class StudentSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)  # link to User

    class Meta:
        model = Student
        fields = ['id', 'user', 'department', 'roll_number']  # add other fields as needed






class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "role"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
    
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token["role"] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Add role info to the response body
        data["role"] = self.user.role
        data["username"] = self.user.username
        return data

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name']

class SubjectSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), source='department', write_only=True
    )

    class Meta:
        model = Subject
        fields = ['id', 'name', 'department', 'department_id']

class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Document
        fields = "__all__"


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name"]



class SimpleUserSerializer(serializers.ModelSerializer):
    """
    Minimal user serializer used when we only need username / id in nested responses.
    """
    class Meta:
        model = User
        fields = ("id", "username", "email")

class LetterSerializer(serializers.ModelSerializer):
    owner = serializers.StringRelatedField(read_only=True)  # show username

    class Meta:
        model = Letter
        fields = "__all__"
        read_only_fields = ["owner", "created_at", "updated_at"]


class RequestHistorySerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()

    class Meta:
        model = RequestHistory
        fields = "__all__"


class RequestSerializer(serializers.ModelSerializer):
    letter = LetterSerializer(read_only=True)
    staff = serializers.StringRelatedField() 
    class Meta:
        model = Request
        fields = "__all__"
        read_only_fields = ["student", "staff_approved", "staff_approved_at", "admin_approved", "admin_approved_at"]


class RequestActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Request
        fields = ["staff_status", "staff_comment"]

class AdminActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Request
        fields = ["admin_status", "admin_comment"]  # admin can add a comment



class NoticeCommentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.username", read_only=True)

    class Meta:
        model = NoticeComment
        fields = ["id", "student_name", "comment", "created_at"]

class NoticeSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    comments = NoticeCommentSerializer(many=True, read_only=True)
    acknowledgements_count = serializers.SerializerMethodField()

    class Meta:
        model = Notice
        fields = [
            "id",
            "title",
            "content",
            "image",
            "created_at",
            "author_name",
            "comments",
            "acknowledgements_count",
        ]

    def get_author_name(self, obj):
        if hasattr(obj.author, "staffprofile"):
            return obj.author.staffprofile.user.username
        elif hasattr(obj.author, "adminprofile"):
            return obj.author.adminprofile.user.username
        return obj.author.username

    def get_acknowledgements_count(self, obj):
        return obj.acknowledgements.count()


class NoticeAcknowledgementSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.username", read_only=True)

    class Meta:
        model = NoticeAcknowledgement
        fields = ["id", "student_name", "acknowledged_at"]


