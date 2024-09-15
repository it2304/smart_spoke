import json
import torch
from transformers import AutoTokenizer, AutoModel
import numpy as np
import os

# Load the JSON files
diseases = ['dengue', 'COVID19', 'typhoid', 'malaria', 'mahimahi']
disease_symptoms = {}

# Function to extract symptoms from a disease data structure
def extract_symptoms(symptom_data):
    symptoms = []
    for category, data in symptom_data.items():
        if isinstance(data, list):
            symptoms.extend(data)
        elif isinstance(data, dict):
            for subcategory, subdata in data.items():
                if isinstance(subdata, list):
                    symptoms.extend(subdata)
    return sorted(list(set(symptoms)))  # Remove duplicates and sort

# Load symptoms for each disease
for disease in diseases:
    file_path = f'app/symptoms/{disease}.json'
    if not os.path.exists(file_path):
        print(f"File does not exist: {file_path}")
        continue
    if os.path.getsize(file_path) == 0:
        print(f"File is empty: {file_path}")
        continue
    
    with open(file_path, 'r') as f:
        content = f.read()
        print(f"First 100 characters of {disease}.json:")
        print(content[:100])
        
    # Then try to parse the JSON
    try:
        data = json.loads(content)
    except json.JSONDecodeError as e:
        print(f"JSON decode error in {disease}.json: {str(e)}")
        continue
    
    disease_symptoms[disease] = extract_symptoms(data[disease]['symptoms'])

# Load BioBERT model and tokenizer
model_name = "cambridgeltl/BioRedditBERT-uncased"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name)

# Function to create embeddings
def create_embedding(text):
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
    return outputs.last_hidden_state.mean(dim=1).squeeze().numpy()

# Create embeddings for each disease's symptoms
disease_embeddings = {}
for disease, symptoms in disease_symptoms.items():
    embeddings = []
    for symptom in symptoms:
        embedding = create_embedding(symptom)
        embeddings.append(embedding.tolist())  # Convert numpy array to list
    disease_embeddings[disease] = embeddings

    print(f"Created embeddings for {len(symptoms)} symptoms of {disease}")
    print(f"Embedding shape for {disease}: {np.array(embeddings).shape}")

# Save embeddings to JSON file
with open('disease_symptom_embeddings.json', 'w') as f:
    json.dump(disease_embeddings, f)

# Save the list of symptoms for each disease
with open('disease_symptom_lists.json', 'w') as f:
    json.dump(disease_symptoms, f)

print("Embeddings and symptom lists for each disease saved successfully as JSON files.")