# Dynatrace Cartography - Client

Application React pour la cartographie des applications Dynatrace.

## Prérequis

- Node.js 18+
- Docker
- Kubernetes (pour le déploiement)
- kubectl
- kustomize

## Installation en développement

```bash
# Installation des dépendances
npm install

# Démarrage du serveur de développement
npm start
```

## Build Docker

Pour construire l'image Docker de l'application :

```bash
# Construction de l'image
docker build -t dynatrace-cartography:latest .

# Pour tester l'image localement
docker run -p 3000:80 dynatrace-cartography:latest
```

## Déploiement Kubernetes

### Configuration

Les fichiers de configuration Kubernetes se trouvent dans le dossier `k8s/` :

- `deployment.yaml` : Configuration du déploiement
- `service.yaml` : Configuration du service
- `configmap.yaml` : Variables d'environnement
- `secrets.yaml` : Secrets (à configurer avec vos valeurs)
- `kustomization.yaml` : Configuration Kustomize

### Préparation des secrets

Avant le déploiement, vous devez encoder vos secrets en base64 :

```bash
# Pour le token Dynatrace
echo -n "votre-token" | base64

# Pour l'URL Dynatrace
echo -n "votre-url" | base64
```

Mettez à jour le fichier `k8s/secrets.yaml` avec les valeurs encodées.

### Déploiement

1. Pousser l'image vers votre registre Docker :

```bash
# Tag de l'image
docker tag dynatrace-cartography:latest votre-registry/dynatrace-cartography:latest

# Push de l'image
docker push votre-registry/dynatrace-cartography:latest
```

2. Mettre à jour l'image dans le fichier `deployment.yaml` si nécessaire

3. Déployer l'application :

```bash
# Déploiement avec Kustomize
kubectl apply -k k8s/

# Vérifier le déploiement
kubectl get pods
kubectl get services
```

### Configuration du déploiement

Le déploiement est configuré avec :
- 2 réplicas pour la haute disponibilité
- Ressources limitées :
  - CPU : 100m-200m
  - Mémoire : 128Mi-256Mi
- Probes de santé :
  - Readiness probe : vérifie la disponibilité de l'application
  - Liveness probe : vérifie que l'application fonctionne correctement

### Service

Le service est configuré en type LoadBalancer et expose l'application sur le port 80.

## Structure du projet

```
client/
├── src/                    # Code source React
├── public/                 # Fichiers statiques
├── k8s/                    # Configuration Kubernetes
│   ├── deployment.yaml     # Configuration du déploiement
│   ├── service.yaml        # Configuration du service
│   ├── configmap.yaml      # Variables d'environnement
│   ├── secrets.yaml        # Secrets
│   └── kustomization.yaml  # Configuration Kustomize
├── Dockerfile              # Configuration Docker
└── nginx.conf              # Configuration Nginx
```

## Variables d'environnement

Les variables d'environnement sont configurées dans `k8s/configmap.yaml` :
- `NODE_ENV` : Environnement d'exécution
- `REACT_APP_API_URL` : URL de l'API backend

Les secrets sont stockés dans `k8s/secrets.yaml` :
- `DYNATRACE_API_TOKEN` : Token d'authentification Dynatrace
- `DYNATRACE_URL` : URL de l'instance Dynatrace

## Maintenance

### Mise à jour de l'application

1. Mettre à jour le code source
2. Reconstruire l'image Docker
3. Pousser la nouvelle image
4. Redéployer avec Kubernetes :

```bash
kubectl rollout restart deployment dynatrace-cartography
```

### Logs

Pour consulter les logs :

```bash
# Logs d'un pod spécifique
kubectl logs -f deployment/dynatrace-cartography

# Logs de tous les pods
kubectl logs -f -l app=dynatrace-cartography
```

### Monitoring

L'application est configurée avec des probes de santé pour le monitoring :
- Readiness probe : vérifie toutes les 10 secondes
- Liveness probe : vérifie toutes les 20 secondes 