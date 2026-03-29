import os
import sys

# Remove problematic files
files_to_remove = [
    r'c:\Users\USER\cabox\src\app\icon.ico',
    r'c:\Users\USER\cabox\src\app\favicon.ico',
    r'c:\Users\USER\cabox\src\app\favicon.ts'
]

for file_path in files_to_remove:
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"Deleted: {file_path}")
    except Exception as e:
        print(f"Error deleting {file_path}: {e}")

print("Cleanup complete")
