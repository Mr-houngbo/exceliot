FROM python:3.11-slim

WORKDIR /app

# Dépendances système (optionnel si besoin de bibliothèques C)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copie tout le dossier local vers /app
COPY . .

# Expose le port (FastAPI par défaut)
EXPOSE 8000

# Commande de lancement par défaut
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
