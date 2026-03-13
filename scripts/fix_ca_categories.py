import json
import os

mapping = {
    "Abstract": "Abstracte",
    "Business": "Negocis",
    "Clothing": "Roba",
    "Food": "Menjar",
    "History": "Història",
    "Nature": "Natura",
    "Objects": "Objectes",
    "People": "Gent",
    "Places": "Llocs",
    "Science": "Ciència",
    "Tech": "Tecnologia",
    "Travel": "Viatges"
}

file_path = "data/ca.json"

if os.path.exists(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for key in data:
        cat = data[key].get("category")
        if cat in mapping:
            data[key]["category"] = mapping[cat]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Fixed categories in {file_path}")
