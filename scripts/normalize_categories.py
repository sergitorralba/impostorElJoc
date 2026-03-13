import json
import os

mapping = {
    "Abstracto": "Abstract",
    "Abstracte": "Abstract",
    "Animales": "Animals",
    "Dieren": "Animals",
    "Arte": "Art",
    "Kunst": "Art",
    "Negocios": "Business",
    "Negocis": "Business",
    "Ropa": "Clothing",
    "Kleding": "Clothing",
    "Comida": "Food",
    "Menjar": "Food",
    "Eten": "Food",
    "Muebles": "Furniture",
    "Mobles": "Furniture",
    "Meubels": "Furniture",
    "Historia": "History",
    "Història": "History",
    "Geschiedenis": "History",
    "Naturaleza": "Nature",
    "Natura": "Nature",
    "Natuur": "Nature",
    "Objetos": "Objects",
    "Objectes": "Objects",
    "Objecten": "Objects",
    "Lugares": "Places",
    "Plaatsen": "Places",
    "Ciencia": "Science",
    "Wetenschap": "Science",
    "Tecnologia": "Tech",
    "Tecnología": "Tech",
    "Viajes": "Travel",
    "Viatges": "Travel",
    "Reizen": "Travel"
}

files = ["data/en.json", "data/es.json", "data/ca.json", "data/nl.json"]

for file_path in files:
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for key in data:
            cat = data[key].get("category")
            if cat in mapping:
                data[key]["category"] = mapping[cat]
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Normalized {file_path}")
