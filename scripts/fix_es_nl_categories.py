import json
import os

def fix_categories(file_path, mapping):
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

es_mapping = {
    "Abstract": "Abstracto",
    "Animals": "Animales",
    "Art": "Arte",
    "Business": "Negocios",
    "Clothing": "Ropa",
    "Food": "Comida",
    "History": "Historia",
    "Nature": "Naturaleza",
    "Objects": "Objetos",
    "People": "Gente",
    "Places": "Lugares",
    "Science": "Ciencia",
    "Tech": "Tecnología",
    "Travel": "Viajes"
}

nl_mapping = {
    "Abstract": "Abstract",
    "Animals": "Dieren",
    "Art": "Kunst",
    "Business": "Zaken",
    "Clothing": "Kleding",
    "Food": "Eten",
    "History": "Geschiedenis",
    "Nature": "Natuur",
    "Objects": "Objecten",
    "People": "Mensen",
    "Places": "Plaatsen",
    "Science": "Wetenschap",
    "Tech": "Technologie",
    "Travel": "Reizen"
}

fix_categories("data/es.json", es_mapping)
fix_categories("data/nl.json", nl_mapping)
