from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status, permissions, parsers
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
import uuid
import pandas as pd
import json

from rest_framework_simplejwt.authentication import JWTAuthentication
import logging

logger = logging.getLogger(__name__)

from accounts.models import (
    Subject, Student, Department, AttendanceSession, AttendanceRecord, 
    ClassAdvisor, User, TimeTable, ScheduleEntry
)
from accounts.serializers import (
    SubjectSerializer, StudentSerializer, DepartmentSerializer, 
    AttendanceSessionSerializer, AttendanceRecordSerializer, 
    ClassAdvisorSerializer, TimeTableSerializer, ScheduleEntrySerializer
)

class SubjectViewSet(ModelViewSet):
    """
    CRUD for Subjects.
    Includes bulk upload via CSV/Excel.
    """
    queryset = Subject.objects.select_related('department').all()
    serializer_class = SubjectSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        
        if not (user.is_super_admin or user.is_principal):
             if hasattr(user, 'department') and user.department:
                 qs = qs.filter(department=user.department)
             else:
                 return Subject.objects.none()
        return qs

    def list(self, request, *args, **kwargs):
        logger.info(f"Updated SubjectViewSet accessed by user: {request.user}")
        return super().list(request, *args, **kwargs)


    @action(detail=False, methods=['post'], parser_classes=[parsers.MultiPartParser])
    def upload(self, request):
        file = request.FILES.get('file')
        preview = request.data.get('preview') == 'true'
        
        if not file:
            return Response({"error": "No file uploaded"}, status=400)

        try:
            if file.name.endswith('.csv'):
                df = pd.read_csv(file)
            else:
                df = pd.read_excel(file)
            
            # Normalize Headers: lowercase and strip spaces
            df.columns = df.columns.astype(str).str.lower().str.strip()

            processed_rows = []
            errors = []
            valid_count = 0

            # Get User's Department (if available) as fallback
            user_dept = None
            if hasattr(request.user, 'department'):
                user_dept = request.user.department

            total_rows = len(df)
            
            for index, row in df.iterrows():
                row_data = {}
                row_errors = []
                
                try:
                    # Validate Name & Code
                    name = row.get('name')
                    code = row.get('code')
                    
                    if pd.isna(name) or pd.isna(code):
                        row_errors.append("Missing Name or Code")
                    else:
                        clean_code = str(code).strip()
                        # Check for Duplicates (only if we are seemingly creating new ones)
                        # The user requested "it should not allow duplicates".
                        # So we block if code exists.
                        if Subject.objects.filter(code=clean_code).exists():
                            row_errors.append(f"Subject Code '{clean_code}' already exists")

                    # Resolve Department
                    dept_name = row.get('department')
                    dept = None
                    
                    if pd.notna(dept_name):
                        dept = Department.objects.filter(name__iexact=str(dept_name).strip()).first()
                        if not dept:
                            row_errors.append(f"Department '{dept_name}' not found")
                    elif user_dept:
                        dept = user_dept
                    else:
                        row_errors.append("Department required (column missing or user has no dept)")

                    # Other Fields
                    semester = row.get('semester', 1)
                    year = row.get('year', 1)
                    credits = row.get('transcript_credits', 3)
                    subject_type = row.get('subject_type', 'Theory')
                    subject_category = row.get('subject_category', 'Core')
                    
                    # Build Row Data
                    if not row_errors:
                        row_data = {
                            'name': name,
                            'code': str(code).strip(),
                            'alias': row.get('alias', str(code).strip()),
                            'department': dept.name, # For display
                            'semester': semester,
                            'year': year,
                            'transcript_credits': credits,
                            'subject_type': subject_type,
                            'subject_category': subject_category
                        }
                        
                        if not preview:
                            print(f"Creating Subject: {row_data['code']}")
                            Subject.objects.create(
                                name=row_data['name'],
                                code=row_data['code'],
                                alias=row_data['alias'],
                                department=dept,
                                semester=row_data['semester'],
                                year=row_data['year'],
                                transcript_credits=row_data['transcript_credits'],
                                subject_type=row_data['subject_type'],
                                subject_category=row_data['subject_category']
                            )
                        
                        valid_count += 1
                    else:
                        for err in row_errors:
                            print(f"Skipping Row {index+2}: {err}")
                        errors.extend([f"Row {index+2}: {err}" for err in row_errors])

                    if preview and not row_errors:
                        processed_rows.append(row_data)

                except Exception as e:
                    print(f"Error processing row {index+2}: {e}")
                    errors.append(f"Row {index+2}: {str(e)}")

            if preview:
                return Response({
                    "preview": True,
                    "valid_count": valid_count,
                    "total_count": total_rows,
                    "subjects": processed_rows,
                    "errors": errors
                })

            print(f"Upload Complete. Valid: {valid_count}/{total_rows}")
            return Response({
                "message": f"Processed {valid_count}/{total_rows} subjects successfully",
                "errors": errors
            })

        except Exception as e:
            return Response({"error": str(e)}, status=400)

class StudentViewSet(ModelViewSet):
    """
    Detailed Student Management.
    """
    queryset = Student.objects.select_related('user', 'department').all()
    serializer_class = StudentSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()

        # Enforce Department Isolation
        if not (user.is_super_admin or user.is_principal):
             if hasattr(user, 'department') and user.department:
                 qs = qs.filter(department=user.department)
             else:
                 # If user has no dept and isn't admin, return nothing for safety
                 return Student.objects.none()

        dept_id = self.request.query_params.get('department')
        year = self.request.query_params.get('year')
        section = self.request.query_params.get('section')
        
        if dept_id:
            qs = qs.filter(department_id=dept_id)
        if year:
            qs = qs.filter(year=year)
        if section:
            clean_section = section.strip()
            qs = qs.filter(section__iexact=clean_section)
            
        logger.info(f"Student Filtering: user={user.username}, dept_filter={dept_id}, year={year}, section={section}, Count={qs.count()}")
        return qs

    @action(detail=False, methods=['post'])
    def update_academic_status(self, request):
        student_ids = request.data.get('student_ids', [])
        status_val = request.data.get('status') # 'Studying' or 'Discontinued'

        if not student_ids:
            return Response({"error": "No students selected"}, status=400)

        students = Student.objects.filter(id__in=student_ids)
        if status_val:
            students.update(academic_status=status_val)
            return Response({"message": f"Updated academic status to {status_val} successfully"})
        
        return Response({"error": "Status value required"}, status=400)

class ClassAdvisorViewSet(ModelViewSet):
    queryset = ClassAdvisor.objects.all()
    serializer_class = ClassAdvisorSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if not (user.is_super_admin or user.is_principal):
             if hasattr(user, 'department') and user.department:
                 qs = qs.filter(department=user.department)
             else:
                 return ClassAdvisor.objects.none()
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        from rest_framework.exceptions import ValidationError
        
        if not (user.is_super_admin or user.is_principal):
             if hasattr(user, 'department') and user.department:
                 serializer.save(department=user.department)
             else:
                 raise ValidationError({"department": "Your account is not linked to any department."})
        else:
             serializer.save()

    @action(detail=False, methods=['get'])
    def my_advisory(self, request):
        from django.db.models import Q
        user = request.user
        advisor_record = ClassAdvisor.objects.filter(Q(advisor1=user) | Q(advisor2=user)).first()
        
        if not advisor_record:
            return Response({"assigned": False}, status=200)
            
        dept = advisor_record.department
        year = advisor_record.year
        # Ignore section for student filtering as per user request ("no sections")
        students_qs = Student.objects.filter(department=dept, year=year)
        count = students_qs.count()

        # Use code if available, else generate formatted name
        dept_short = dept.code
        if not dept_short:
             name = dept.name.strip()
             prefix = ""
             
             # Identify prefix
             name_lower = name.lower()
             if name_lower.startswith("b.tech"):
                 prefix = "B.Tech"
                 name = name[6:] 
             elif name_lower.startswith("btech"):
                 prefix = "B.Tech"
                 name = name[5:]
             elif name_lower.startswith("b.e"):
                 prefix = "B.E"
                 name = name[3:]
             elif name_lower.startswith("m.tech"):
                 prefix = "M.Tech"
                 name = name[6:]
             elif name_lower.startswith("m.e"):
                 prefix = "M.E"
                 name = name[3:]
             elif name_lower.startswith("m.b.a"):
                 prefix = "MBA"
                 name = name[5:]
                 
             # Define ignored words for the rest of the name
             ignored_set = {
                 'department', 'dept', 'of', 'and', '&', 'the', 'in', '-', ':'
             }
             
             # Clean name: remove special chars
             clean_name = name.replace('-', ' ').replace(':', ' ').replace('.', '')
             words = [w for w in clean_name.split() if w.lower() not in ignored_set]
             
             acronym = ""
             if words:
                 acronym = "".join([w[0] for w in words]).upper()
             else:
                 pass # Fallback handled below/or empty
                 
             if not acronym and len(words) == 0:
                 # If all words were ignored or empty, revert to original substring
                 acronym = name.strip()[:3].upper()

             if prefix:
                 dept_short = f"{prefix} - {acronym}"
             else:
                 dept_short = acronym
        
        # --- Compute Stats ---
        total_students = count
        avg_attn = 0
        low_perf_count = 0
        
        if total_students > 0:
             # Get all attendance records for these students
             total_sessions = AttendanceSession.objects.filter(
                 subject__department=dept, year=year
             ).count() 
             # Note: This session count is rough since students might have electives, but good for summary.
             # Better: Average the individual student percentages.
             
             student_percentages = []
             for stud in students_qs:
                 s_total = AttendanceRecord.objects.filter(student=stud).count()
                 s_present = AttendanceRecord.objects.filter(
                     student=stud, status__in=['Present', 'OnDuty']
                 ).count()
                 
                 pct = (s_present / s_total * 100) if s_total > 0 else 0
                 student_percentages.append(pct)
                 
                 if pct < 75: # Threshold for low performance
                     low_perf_count += 1
             
             if student_percentages:
                 avg_attn = sum(student_percentages) / len(student_percentages)

        return Response({
            "assigned": True,
            "class_name": f"{dept_short} - {year} Year", 
            "year": year,
            "section": "", 
            "department_id": dept.id,
            "stats": {
                "students": count,
                "avgAttn": f"{round(avg_attn, 1)}%", 
                "lowPerf": low_perf_count 
            }
        })

class AttendanceViewSet(ModelViewSet):
    """
    Attendance Management.
    """
    queryset = AttendanceSession.objects.prefetch_related('records').all()
    serializer_class = AttendanceSessionSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        date = self.request.query_params.get('date')
        staff_id = self.request.query_params.get('staff')
        
        if date:
            qs = qs.filter(date=date)
        if staff_id:
            qs = qs.filter(staff_id=staff_id)
        
        return qs

    @action(detail=False, methods=['get'])
    def get_students(self, request):
        """
        Get student list for attendance marking based on class params.
        """
        dept_id = request.query_params.get('department')
        year = request.query_params.get('year')
        section = request.query_params.get('section')
        user = request.user

        if not (dept_id and year):
             return Response({"error": "Department and Year required"}, status=400)

        # Enforce Department Isolation for non-super-admins
        if not (user.is_super_admin or user.is_principal):
             if hasattr(user, 'department') and user.department:
                 if str(dept_id) != str(user.department.id):
                      return Response({"error": "Unauthorized department access"}, status=403)
             else:
                 return Response({"error": "User department not configured"}, status=403)

        students = Student.objects.filter(department_id=dept_id, year=year)
        if section:
            students = students.filter(section=section)
            
        data = StudentSerializer(students, many=True).data
        return Response(data)

    @action(detail=False, methods=['post'])
    def mark(self, request):
        """
        Submit attendance for a session.
        Payload: {
            "subject": ID, "date": "YYYY-MM-DD", "start_time": "HH:MM", "end_time": "HH:MM",
            "year": 3, "semester": 5, "section": "A",
            "records": [ {"student_id": 1, "status": "Present"}, ... ]
        }
        """
        data = request.data
        subject_id = data.get('subject')
        
        # Validate Subject
        subject = get_object_or_404(Subject, id=subject_id)

        # Create Session
        session = AttendanceSession.objects.create(
            subject=subject,
            staff=request.user,
            date=data.get('date'),
            start_time=data.get('start_time'),
            end_time=data.get('end_time', '10:00'),
            year=data.get('year'),
            semester=data.get('semester', 1),
            section=data.get('section', ''),
            hour=data.get('hour', ''),
            mode_of_hour=data.get('mode_of_hour', ''),
            class_mode=data.get('class_mode', ''),
            unit_number=data.get('unit_number', ''),
            mode_of_teaching=data.get('mode_of_teaching', ''),
            topics_covered=data.get('topics_covered', '')
        )

        # Create Records
        records_data = data.get('records', [])
        records = []
        for rec in records_data:
            records.append(AttendanceRecord(
                session=session,
                student_id=rec['student_id'],
                status=rec.get('status', 'Present'),
                remarks=rec.get('remarks', '')
            ))
        
        AttendanceRecord.objects.bulk_create(records)
        
        return Response(AttendanceSessionSerializer(session).data, status=201)

    @action(detail=False, methods=['get'])
    def report(self, request):
        """
        Get attendance percentage for a student or class.
        """
        student_id = request.query_params.get('student_id')
        if student_id:
            total = AttendanceRecord.objects.filter(student_id=student_id).count()
            present = AttendanceRecord.objects.filter(
                student_id=student_id, status__in=['Present', 'OnDuty']
            ).count()
            
            percentage = (present / total * 100) if total > 0 else 0
            return Response({"total": total, "present": present, "percentage": round(percentage, 2)})
            
        return Response({"error": "Student ID required for individual report"}, status=400)

class TimeTableViewSet(ModelViewSet):
    """
    Manage Timetables and their entries.
    """
    queryset = TimeTable.objects.select_related('department', 'created_by').prefetch_related('entries', 'entries__subject', 'entries__staff').all()
    serializer_class = TimeTableSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        
        # Enforce Department Isolation
        if not (user.is_super_admin or user.is_principal):
             if hasattr(user, 'department') and user.department:
                 qs = qs.filter(department=user.department)
             else:
                 return TimeTable.objects.none()
        
        return qs
        
    def perform_create(self, serializer):
        user = self.request.user
        if hasattr(user, 'department') and user.department:
            serializer.save(created_by=user, department=user.department)
        else:
            serializer.save(created_by=user)

    @action(detail=True, methods=['post'])
    def upsert_entries(self, request, pk=None):
        timetable = self.get_object()
        entries_data = request.data.get('entries', [])
        
        saved_entries = []
        for entry_data in entries_data:
            day = entry_data.get('day')
            period_number = entry_data.get('period_number')
            
            # Find subject and staff (allowing null/clearing)
            subject_id = entry_data.get('subject')
            staff_id = entry_data.get('staff')

            if subject_id == "": subject_id = None
            if staff_id == "": staff_id = None
            
            # Start/End times (optional)
            start_time = entry_data.get('start_time')
            end_time = entry_data.get('end_time')
            
            # Handle empty values safely
            if start_time == "": start_time = None
            if end_time == "": end_time = None

            entry, created = ScheduleEntry.objects.update_or_create(
                timetable=timetable,
                day=day,
                period_number=period_number,
                defaults={
                    'subject_id': subject_id,
                    'staff_id': staff_id,
                    'is_break': entry_data.get('is_break', False),
                    'break_name': entry_data.get('break_name', ''),
                    'start_time': start_time,
                    'end_time': end_time,
                }
            )
            saved_entries.append(entry)
            
        return Response({"status": "success", "entries_processed": len(saved_entries)})

class StaffScheduleView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data
        
        class_name = data.get('class_name')
        section = data.get('section')
        year = data.get('year')
        day = data.get('day')
        period = data.get('period')
        subject_input = data.get('subject') 
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        
        if not all([class_name, section, year, day, period]):
            return Response({"error": "Missing required fields: class_name, section, year, day, period"}, status=400)

        # Resolve Subject
        subject_instance = None
        if subject_input:
            s_input = str(subject_input).strip()
            if s_input.isdigit():
                 subject_instance = Subject.objects.filter(id=int(s_input)).first()
            else:
                 # Try finding by name. 
                 # If user.department is set, prioritize that, but failing that, global find?
                 # Assuming Subject names are unique-ish or just pick first.
                 subject_instance = Subject.objects.filter(name__iexact=s_input).first()
                 
            if not subject_instance and s_input:
                 # Should we return error?
                 return Response({"error": f"Subject '{s_input}' not found. Please ask Admin to add it."}, status=400)

        department = user.department if user.department else None
        
        timetable, created = TimeTable.objects.get_or_create(
            class_name=class_name,
            section=section,
            year=year,
            department=department,
            defaults={
                'title': f"{class_name} {section}",
                'status': 'published',
                'created_by': user
            }
        )

        existing = ScheduleEntry.objects.filter(timetable=timetable, day=day, period_number=period).exclude(staff=user).first()
        if existing and existing.staff:
            return Response({"error": f"Slot already taken by {existing.staff.username}"}, status=400)
            
        entry, _ = ScheduleEntry.objects.update_or_create(
            timetable=timetable,
            day=day,
            period_number=period,
            defaults={
                'staff': user,
                'subject': subject_instance,
                'start_time': start_time,
                'end_time': end_time,
                'is_break': False 
            }
        )
        
        return Response({"message": "Schedule updated", "entry_id": entry.id})


    def get(self, request):
        user = request.user
        entries = ScheduleEntry.objects.filter(staff=user).select_related('timetable', 'subject').order_by('day', 'period_number')
        
        schedule = {}
        # Initialize days
        for day, _ in ScheduleEntry.DAY_CHOICES:
            schedule[day] = []
            
        for entry in entries:
            day = entry.day
            if day not in schedule:
                schedule[day] = []
            
            schedule[day].append({
                "id": entry.id,
                "period": entry.period_number,
                "start_time": entry.start_time,
                "end_time": entry.end_time,
                "subject": entry.subject.name if entry.subject else "Free",
                "subject_code": entry.subject.code if entry.subject else "",
                "class_name": entry.timetable.class_name,
                "section": entry.timetable.section,
                "year": entry.timetable.year,
                "is_break": entry.is_break,
                "break_name": entry.break_name
            })
            
        return Response(schedule)

class StaffUpcomingClassView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.utils import timezone
        import datetime
        
        user = request.user
        now = timezone.localtime(timezone.now())
        today_name = now.strftime("%A")
        current_time = now.time()
        
        entries = ScheduleEntry.objects.filter(
            staff=user, 
            day=today_name
        ).select_related('timetable', 'subject').order_by('period_number')
        
        upcoming = None
        
        for entry in entries:
            if entry.end_time:
                if entry.end_time > current_time:
                    upcoming = entry
                    break
        
        # if not upcoming and entries.exists():
        #      upcoming = entries.first()
             
        if upcoming:
             return Response({
                 "subject": upcoming.subject.name if upcoming.subject else "No Subject",
                 "class_name": upcoming.timetable.class_name,
                 "section": upcoming.timetable.section,
                 "time": f"{upcoming.start_time} - {upcoming.end_time}" if upcoming.start_time else f"Period {upcoming.period_number}",
                 "room": "TBD"
             })
             
        return Response(status=204)


from django.db.models import Count, Q, F, FloatField, ExpressionWrapper

class AttendanceHistoryViewSet(ModelViewSet):
    from accounts.serializers import AttendanceHistorySerializer
    serializer_class = AttendanceHistorySerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Base Query: Annotate counts
        qs = AttendanceSession.objects.select_related('subject', 'staff', 'staff__department').annotate(
            total_count=Count('records'),
            present_count=Count('records', filter=Q(records__status="Present")),
            absent_count=Count('records', filter=Q(records__status="Absent")),
        ).annotate(
            percentage=ExpressionWrapper(
                F('present_count') * 100.0 / F('total_count'),
                output_field=FloatField()
            )
        ).order_by('-date', '-start_time')
        
        # Role-based filtering
        if user.is_super_admin or user.is_principal:
            # Can see everything. Filter by params optionally.
            dept_id = self.request.query_params.get('department')
            if dept_id:
                qs = qs.filter(staff__department_id=dept_id)
            return qs
            
        if user.is_dept_admin:
            # Filter by department
            qs = qs.filter(staff__department=user.department)
            return qs
            
        if user.is_dept_staff:
            # Filter by self
            qs = qs.filter(staff=user)
            return qs
            
        return AttendanceSession.objects.none()

# Reload comment
