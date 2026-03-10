import json
import os
import sys

def merge_json(file_path, new_data):
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                data = {}
    else:
        data = {}
    
    data.update(new_data)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python merge_data.py <file_path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    new_json_str = sys.stdin.read()
    if new_json_str:
        new_data = json.loads(new_json_str)
        merge_json(file_path, new_data)
