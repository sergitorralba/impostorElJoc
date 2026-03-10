import json
import os

def merge_to_en_json(new_data):
    file_path = '/Users/sergitorralba/Workspaces/AI/impostorElJoc/data/en.json'
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
    import sys
    new_json_str = sys.stdin.read()
    if new_json_str:
        new_data = json.loads(new_json_str)
        merge_to_en_json(new_data)
