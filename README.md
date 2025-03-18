# Dynatrace Cartography - Client

Application React pour la cartographie des applications Dynatrace.

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

## Build Docker

L'application utilise un build Docker multi-stage pour optimiser la sécurité et la taille de l'image :

### Étapes du build

1. **Stage de build** :
   - Utilise `node:18-alpine` pour le build
   - Installe les dépendances avec `npm ci` pour un build reproductible
   - Compile l'application React

2. **Stage de production** :
   - Utilise `nginx:alpine-slim` comme image minimale
   - Ne contient que les fichiers statiques compilés
   - Exécute nginx en tant qu'utilisateur non-root
   - Configuration nginx optimisée pour React

### Construction de l'image

```bash
# Construction de l'image
docker build -t dynatrace-cartography:latest .

# Pour tester l'image localement
docker run -p 3000:80 dynatrace-cartography:latest

# Vérifier la taille de l'image
docker images dynatrace-cartography:latest
```

### Sécurité du conteneur

- Utilisation d'une image de base minimale (nginx:alpine-slim)
- Exécution en tant qu'utilisateur non-root (nginx)
- Pas de packages de build ou de dépendances de développement dans l'image finale
- Suppression des fichiers nginx par défaut non nécessaires
- Permissions minimales sur les fichiers nginx

## Déploiement Kubernetes

### Configuration

Les fichiers de configuration Kubernetes se trouvent dans le dossier `k8s/` :

- `deployment.yaml` : Configuration du déploiement
- `service.yaml` : Configuration du service
- `secrets.yaml` : Secrets (à configurer avec vos valeurs)
- `ingress.yaml` : Configuration de l'Ingress
- `network-policy.yaml` : Politiques réseau
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

### Configuration de l'Ingress

1. Modifiez le fichier `k8s/ingress.yaml` pour définir votre domaine :
```yaml
spec:
  rules:
  - host: votre-domaine.com  # Remplacez par votre domaine
```

2. Assurez-vous que votre cluster a un Ingress Controller installé :
```bash
# Pour nginx-ingress
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx
```

### Network Policies

La configuration inclut une NetworkPolicy qui :
- Restreint le trafic sortant aux API Dynatrace
- Autorise le trafic DNS (port 53)
- Bloque tout autre trafic sortant
- S'applique aux pods avec le label `app: dynatrace-cartography`

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
kubectl get ingress
kubectl get networkpolicies
```

4. Configurer votre DNS pour pointer vers l'adresse IP de votre Ingress Controller

### Vérification du déploiement

```bash
# Vérifier les logs des pods
kubectl logs -l app=dynatrace-cartography

# Vérifier l'état des secrets
kubectl get secrets dynatrace-cartography-secrets

# Vérifier les NetworkPolicies
kubectl describe networkpolicy dynatrace-cartography-network-policy
```

### Configuration du déploiement

Le déploiement est configuré avec :
- 2 réplicas pour la haute disponibilité
- Ressources limitées :
  - CPU : 100m-200m
  - Mémoire : 128Mi-256Mi
- Variables d'environnement :
  - `NODE_ENV` : "production"
- Probes de santé :
  - Readiness probe : vérifie la disponibilité de l'application
  - Liveness probe : vérifie que l'application fonctionne correctement

### Service

Le service est configuré en type LoadBalancer et expose l'application sur le port 443 à l'extérieur, tout en ciblant le port 80 du conteneur en interne.

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

Les variables d'environnement sont définies dans le `deployment.yaml` :
- `NODE_ENV` : "production"

Les secrets sont stockés dans `k8s/secrets.yaml` :
- `REACT_APP_DYNATRACE_API_TOKEN` : Token d'authentification Dynatrace
- `REACT_APP_DYNATRACE_URL` : URL de l'instance Dynatrace

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