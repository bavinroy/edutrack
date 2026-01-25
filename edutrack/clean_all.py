
import os

files = [
    r'c:\Users\HP\Desktop\tail\edutrack\accounts\views.py',
    r'c:\Users\HP\Desktop\tail\edutrack\accounts\urls.py'
]

for file_path in files:
    try:
        if os.path.exists(file_path):
            with open(file_path, 'rb') as f:
                content = f.read()
            
            # Remove null bytes
            clean_content = content.replace(b'\x00', b'')
            
            # Write back only if changed
            if content != clean_content:
                with open(file_path, 'wb') as f:
                    f.write(clean_content)
                print(f"Cleaned {file_path}")
            else:
                print(f"No null bytes in {file_path}")
        else:
             print(f"File not found: {file_path}")
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
