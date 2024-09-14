import json
import torch
from transformers import AutoTokenizer, AutoModel
import numpy as np

# Load the dengue.json file
with open('app/symptoms/dengue.json', 'r') as f:
    dengue_data = json.load(f)

# Extract symptoms
general_symptoms = dengue_data['symptoms']['general_symptoms']
severe_symptoms = dengue_data['symptoms']['severe_symptoms']
all_symptoms = general_symptoms + severe_symptoms

# Load bioBERT model and tokenizer
model_name = "cambridgeltl/BioRedditBERT-uncased"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name)

# Function to create embeddings
def create_embedding(text):
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
    return outputs.last_hidden_state.mean(dim=1).squeeze().numpy()

# Create embeddings for all symptoms
embeddings = []
for symptom in all_symptoms:
    embedding = create_embedding(symptom)
    embeddings.append(embedding)

# Convert embeddings to numpy array
embeddings_array = np.array(embeddings)

# Save embeddings to file
np.save('symptom_embeddings.npy', embeddings_array)

# Print some information
print(f"Created embeddings for {len(all_symptoms)} symptoms")
print(f"Embedding shape: {embeddings_array.shape}")

# Optionally, save the list of symptoms for reference
with open('symptom_list.json', 'w') as f:
    json.dump(all_symptoms, f)

print("Embeddings and symptom list saved successfully.")