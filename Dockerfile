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

# Build de l'application
RUN npm run build

# Stage de production avec une image nginx minimale
FROM nginx:alpine-slim

# Suppression de la configuration nginx par défaut
RUN rm -rf /usr/share/nginx/html/* && \
    rm /etc/nginx/conf.d/default.conf

# Copie de la configuration nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie uniquement les fichiers buildés depuis le stage de build
COPY --from=builder /app/build /usr/share/nginx/html

# Définition de l'utilisateur non-root
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Utilisation d'un utilisateur non-root
USER nginx

# Exposition du port 80
EXPOSE 80

# Démarrage de nginx
CMD ["nginx", "-g", "daemon off;"] 