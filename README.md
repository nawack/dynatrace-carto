# Dynatrace Carto - Client

Application React pour la cartographie des applications Dynatrace. Elle permet de visualiser :
- Les hôtes et leurs métriques
- Les applications et leurs dépendances
- Les communications entre applications

## Fonctionnalités

- Visualisation des hôtes avec leurs métriques (CPU, mémoire, disque)
- Cartographie des applications et leurs relations
- Analyse des communications entre applications
- Interface utilisateur moderne avec thème sombre
- Visualisation interactive avec graphes et diagrammes

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

## Build et déploiement

### Construction de l'image Docker

L'application utilise un build Docker multi-stage pour optimiser la sécurité et la taille de l'image :

1. **Stage de build** :
   - Utilise `node:18-alpine` pour le build
   - Installe les dépendances avec `npm ci`
   - Compile l'application React

2. **Stage de production** :
   - Utilise `nginx:alpine-slim` comme image minimale
   - Ne contient que les fichiers statiques compilés
   - Configuration nginx optimisée pour React

```bash
# Construction de l'image
docker build -t dynatrace-carto:latest .

# Pour tester l'image localement
docker run -p 3000:80 dynatrace-carto:latest
```

### Déploiement Kubernetes

#### Configuration

Les fichiers de configuration Kubernetes se trouvent dans le dossier `k8s/` :
- `deployment.yaml` : Configuration du déploiement
- `service.yaml` : Configuration du service
- `secrets.yaml` : Secrets (à configurer avec vos valeurs)
- `ingress.yaml` : Configuration de l'Ingress
- `network-policy.yaml` : Politiques réseau
- `kustomization.yaml` : Configuration Kustomize

#### Configuration des ports

L'application utilise les ports suivants dans Kubernetes :
- **Conteneur** : Port 80 (port interne du conteneur nginx)
- **Service** : Port 80 (expose le port 80 du conteneur)
- **Ingress** : Port 80 (route le trafic HTTP vers le service)
- **NetworkPolicy** : 
  - Port 443 (HTTPS) pour les appels API Dynatrace
  - Port 53 (UDP) pour la résolution DNS

#### Préparation des secrets

Avant le déploiement, vous devez encoder vos secrets en base64 :

```bash
# Pour le token Dynatrace
echo -n "votre-token" | base64

# Pour l'URL Dynatrace (exemple : https://abc12345.live.dynatrace.com)
echo -n "https://votre-instance-dynatrace.com" | base64
```

Mettez à jour le fichier `k8s/secrets.yaml` avec les valeurs encodées.

#### Déploiement

1. Pousser l'image vers votre registre Docker :
```bash
# Tag de l'image
docker tag dynatrace-carto:latest votre-registry/dynatrace-carto:latest

# Push de l'image
docker push votre-registry/dynatrace-carto:latest
```

2. Déployer l'application :
```bash
# Déploiement avec Kustomize
kubectl apply -k k8s/

# Vérifier le déploiement
kubectl get pods
kubectl get services
kubectl get ingress
kubectl get networkpolicies
```

### Configuration du déploiement

Le déploiement est configuré avec :
- 2 réplicas pour la haute disponibilité
- Ressources garanties :
  - CPU : 200m
  - Mémoire : 256Mi
- Variables d'environnement :
  - Secrets Dynatrace (API Token et URL)
- Probes de santé :
  - Readiness probe : vérifie la disponibilité de l'application
  - Liveness probe : vérifie que l'application fonctionne correctement
- Authentification du registre Docker :
  - Utilise le secret `project-registries` pour l'authentification au registre

## Maintenance

### Mise à jour de l'application

1. Mettre à jour le code source
2. Reconstruire l'image Docker
3. Pousser la nouvelle image
4. Redéployer avec Kubernetes :
```bash
kubectl rollout restart deployment dynatrace-carto
```

### Logs

Pour consulter les logs :
```bash
# Logs d'un pod spécifique
kubectl logs -f deployment/dynatrace-carto

# Logs de tous les pods
kubectl logs -f -l app=dynatrace-carto
```

### Monitoring

L'application est configurée avec des probes de santé pour le monitoring :
- Readiness probe : vérifie toutes les 10 secondes
- Liveness probe : vérifie toutes les 20 secondes

## Structure du projet

```
client/
├── src/                    # Code source React
├── public/                 # Fichiers statiques
├── k8s/                    # Configuration Kubernetes
│   ├── deployment.yaml     # Configuration du déploiement
│   ├── service.yaml        # Configuration du service
│   ├── secrets.yaml        # Secrets
│   ├── ingress.yaml        # Configuration de l'Ingress
│   ├── network-policy.yaml # Politiques réseau
│   └── kustomization.yaml  # Configuration Kustomize
├── Dockerfile              # Configuration Docker
└── nginx.conf              # Configuration Nginx
```

## Variables d'environnement

Les secrets sont stockés dans `k8s/secrets.yaml` :
- `REACT_APP_DYNATRACE_API_TOKEN` : Token d'authentification Dynatrace (format : dt0c01.XXXXX)
- `REACT_APP_DYNATRACE_URL` : URL complète de votre instance Dynatrace (exemple : https://abc12345.live.dynatrace.com) 