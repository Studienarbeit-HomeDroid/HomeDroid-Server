# Basis-Image
FROM node:14

# Arbeitsverzeichnis erstellen
WORKDIR /usr/src/app

# Abhängigkeiten installieren
COPY package*.json ./
RUN npm install

# Anwendungscode kopieren
COPY . .

# Port freigeben
EXPOSE 3000

# Befehl zum Starten der Anwendung
CMD ["node", "server.js"]
