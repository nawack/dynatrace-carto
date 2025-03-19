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

# Substitution des variables d'environnement dans la configuration nginx
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