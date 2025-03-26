# Dynatrace Carto - Client

Application React pour la cartographie des applications Dynatrace. Elle permet de visualiser :
- Les hôtes et leurs métriques
- Les applications et leurs dépendances
- Les services et leurs relations
- Les processus et leurs relations
- Les liens entre hôtes
- Les liens entre services
- Les liens entre processus

## Fonctionnalités

- Visualisation des hôtes avec leurs métriques (CPU, mémoire, disque)
- Cartographie des applications et leurs relations
- Gestion des services et leurs dépendances
- Visualisation des processus et leurs relations
- Analyse des liens entre entités avec différents types :
  - Liens entre hôtes (NETWORK)
  - Liens entre services (HTTP, REST, SOAP, gRPC, DATABASE, MESSAGING)
  - Liens entre processus (NETWORK)
- Interface utilisateur moderne avec thème sombre
- Visualisation interactive avec graphes et diagrammes
- Filtrage et recherche avancés pour chaque vue
- Export des données au format JSON
- Métriques détaillées pour chaque type de lien :
  - Métriques réseau (bandwidth, latency, packetLoss)
  - Métriques de performance (calls, responseTime, errorRate, throughput)

## Prérequis

- Node.js 18+
- Docker
- Kubernetes (pour le déploiement)
- kubectl
- kustomize
- Ingress Controller (nginx-ingress recommandé)

## Installation en développement

```bash
# Installation des dépendances
npm install

# Démarrage du serveur de développement
npm start
```

## Configuration de l'API Dynatrace

### Variables d'environnement requises

L'application nécessite deux variables d'environnement essentielles :

- `REACT_APP_DYNATRACE_URL` : L'URL de votre environnement Dynatrace (ex: https://your-environment.live.dynatrace.com)
- `REACT_APP_DYNATRACE_API_TOKEN` : Votre token d'API Dynatrace

### Configuration CORS et Proxy

L'application utilise un proxy nginx pour gérer les appels API à Dynatrace. Cette configuration permet de :

1. Éviter les problèmes CORS en faisant transiter les appels API via le même domaine
2. Sécuriser les appels en masquant le token d'API côté serveur
3. Simplifier la configuration côté client

La configuration du proxy se trouve dans `nginx.conf` et utilise les variables d'environnement :
```nginx
location /api/ {
    set $dynatrace_url "${REACT_APP_DYNATRACE_URL}";
    set $dynatrace_token "${REACT_APP_DYNATRACE_API_TOKEN}";
    proxy_pass $dynatrace_url/;
    proxy_set_header Authorization "Api-Token $dynatrace_token";
    # Configuration CORS et headers...
}
```

Les variables d'environnement sont injectées dans la configuration nginx au démarrage du conteneur via le script `docker-entrypoint.sh`. Cela permet de :
- Masquer le token API côté client
- Gérer l'authentification de manière sécurisée
- Simplifier la configuration côté client
- Vérifier la présence des variables requises
- Valider la substitution des variables dans la configuration

Les appels API sont automatiquement redirigés vers `/api/` et proxifiés vers Dynatrace avec le token d'authentification approprié.

### Configuration en développement

1. Créez un fichier `.env` à la racine du projet avec les variables suivantes :
```
REACT_APP_DYNATRACE_URL=https://your-environment.live.dynatrace.com
REACT_APP_DYNATRACE_API_TOKEN=your-api-token-here
```

2. Pour tester l'image Docker localement avec les variables d'environnement :
```bash
docker build \
  --build-arg REACT_APP_DYNATRACE_URL=https://your-environment.live.dynatrace.com \
  --build-arg REACT_APP_DYNATRACE_API_TOKEN=your-token \
  -t dynatrace-carto:latest .

docker run -p 3000:80 dynatrace-carto:latest
```

### Configuration en production (Kubernetes)

1. Créez un secret Kubernetes avec vos variables d'environnement :
```bash
kubectl create secret generic dynatrace-carto-secrets \
  --from-literal=REACT_APP_DYNATRACE_URL=https://your-environment.live.dynatrace.com \
  --from-literal=REACT_APP_DYNATRACE_API_TOKEN=your-token \
```

2. Déployez l'application avec Kustomize :
```bash
kubectl apply -k k8s/overlays/production
```

## Structure du projet

```
src/
├── components/           # Composants React
│   ├── HostView.tsx     # Vue des hôtes
│   ├── ServiceView.tsx  # Vue des services
│   ├── ApplicationView.tsx # Vue des applications
│   ├── ProcessView.tsx  # Vue des processus
│   ├── HostLinkView.tsx # Vue des liens entre hôtes
│   ├── ServiceLinkView.tsx # Vue des liens entre services
│   └── ProcessLinkView.tsx # Vue des liens entre processus
├── services/            # Services et API
│   └── api.ts          # Fonctions d'appel API
├── config/             # Configuration
│   └── api.ts          # Configuration de l'API
└── App.tsx             # Composant principal
```

## Fonctionnalités par vue

### Vue des hôtes
- Liste des hôtes avec leurs métriques
- Filtrage par type et statut
- Détails des métriques système
- Applications associées

### Vue des services
- Liste des services avec leurs propriétés
- Filtrage par type et technologie
- Détails des métriques de performance
- Applications associées

### Vue des applications
- Liste des applications avec leurs propriétés
- Filtrage par type et statut
- Détails des dépendances
- Hôtes associés

### Vue des processus
- Liste des processus avec leurs propriétés
- Filtrage par type et statut
- Détails des métriques système
- Hôte associé

### Vue des liens entre hôtes
- Liste des liens réseau entre hôtes
- Filtrage par type et statut
- Métriques réseau (bandwidth, latency, packetLoss)
- Détails des connexions

### Vue des liens entre services
- Liste des liens entre services
- Filtrage par type et statut
- Métriques de performance (calls, responseTime, errorRate, throughput)
- Détails des communications

### Vue des liens entre processus
- Liste des liens réseau entre processus
- Filtrage par type et statut
- Métriques réseau (bandwidth, latency, packetLoss)
- Détails des connexions

## Contribution

1. Fork le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails. 