#!/bin/bash

# Vérification des variables d'environnement requises
if [ -z "$REACT_APP_DYNATRACE_URL" ]; then
    echo "Erreur: REACT_APP_DYNATRACE_URL n'est pas définie"
    exit 1
fi

if [ -z "$REACT_APP_DYNATRACE_API_TOKEN" ]; then
    echo "Erreur: REACT_APP_DYNATRACE_API_TOKEN n'est pas définie"
    exit 1
fi

# Création de la configuration nginx avec les variables d'environnement
cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gestion des erreurs
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }

    # Configuration pour le routage React
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache des assets statiques
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }

    # Configuration CORS pour les appels API Dynatrace
    location /api/ {
        proxy_pass ${REACT_APP_DYNATRACE_URL}/;
        proxy_set_header Host ${REACT_APP_DYNATRACE_URL};
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Authorization "Api-Token ${REACT_APP_DYNATRACE_API_TOKEN}";

        # Configuration CORS
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,Accept' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;

        # Gestion des requêtes OPTIONS
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,Accept' always;
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }
}
EOF

# Substitution des variables d'environnement
envsubst '${REACT_APP_DYNATRACE_URL} ${REACT_APP_DYNATRACE_API_TOKEN}' < /etc/nginx/conf.d/default.conf > /etc/nginx/conf.d/default.conf.tmp
mv /etc/nginx/conf.d/default.conf.tmp /etc/nginx/conf.d/default.conf

# Vérification que la substitution a bien fonctionné
if ! grep -q "${REACT_APP_DYNATRACE_URL}" /etc/nginx/conf.d/default.conf; then
    echo "Erreur: La substitution de REACT_APP_DYNATRACE_URL a échoué"
    exit 1
fi

if ! grep -q "${REACT_APP_DYNATRACE_API_TOKEN}" /etc/nginx/conf.d/default.conf; then
    echo "Erreur: La substitution de REACT_APP_DYNATRACE_API_TOKEN a échoué"
    exit 1
fi

# Exécution de la commande passée en argument
exec "$@" 