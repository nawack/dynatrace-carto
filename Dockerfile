# Stage de build
FROM node:18-alpine AS builder

# Définition du répertoire de travail
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances avec un cache clean
RUN npm ci

# Copie du code source
COPY . .

# Build de l'application avec les variables d'environnement
ARG REACT_APP_DYNATRACE_URL
ARG REACT_APP_DYNATRACE_API_TOKEN
ENV REACT_APP_DYNATRACE_URL=$REACT_APP_DYNATRACE_URL
ENV REACT_APP_DYNATRACE_API_TOKEN=$REACT_APP_DYNATRACE_API_TOKEN

# Build de l'application
RUN npm run build

# Stage de production avec une image nginx minimale
FROM nginx:alpine-slim

# Installation des outils de test réseau et autres utilitaires
RUN apk add --no-cache \
    gettext \
    bash \
    curl \
    wget \
    netcat-openbsd \
    bind-tools \
    iputils \
    tcpdump \
    net-tools \
    busybox-extras

# Suppression de la configuration nginx par défaut
RUN rm -rf /usr/share/nginx/html/* && \
    rm /etc/nginx/conf.d/default.conf

# Copie uniquement les fichiers buildés depuis le stage de build
COPY --from=builder /app/build /usr/share/nginx/html

# Exposition du port 80
EXPOSE 80

# Script de démarrage pour substituer les variables d'environnement
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Vérification des variables d'environnement requises
ENV REACT_APP_DYNATRACE_URL=""
ENV REACT_APP_DYNATRACE_API_TOKEN=""

# Utilisation du script de démarrage
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"] 