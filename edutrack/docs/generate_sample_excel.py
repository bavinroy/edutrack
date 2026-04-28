import pandas as pd
import os

# Define sample data
data = {
    'username': ['student_01', 'student_02', 'student_03'],
    'email': ['student1@university.com', 'student2@university.com', 'student3@university.com'],
    'password': ['Welcome@123', 'Welcome@123', 'Welcome@123'],
    'role': ['STUDENT', 'STUDENT', 'STUDENT'],
    'department': ['CSE', 'CSE', 'MECH']  # Note: Department is auto-ignored if uploader is Dept Staff/Admin
}

# Create DataFrame
df = pd.DataFrame(data)

# Save to Excel
file_path = 'student_upload_sample.xlsx'
df.to_excel(file_path, index=False)

print(f"Successfully created sample file at: {os.path.abspath(file_path)}")
