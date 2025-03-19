# Dynatrace Carto - Client

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
docker build -t dynatrace-carto:latest .

# Pour tester l'image localement
docker run -p 3000:80 dynatrace-carto:latest

# Vérifier la taille de l'image
docker images dynatrace-carto:latest
```

### Sécurité du conteneur

- Utilisation d'une image de base minimale (nginx:alpine-slim)
- Pas de packages de build ou de dépendances de développement dans l'image finale
- Suppression des fichiers nginx par défaut non nécessaires
- Permissions minimales sur les fichiers nginx

## Déploiement Kubernetes

### Configuration des ports

L'application utilise les ports suivants dans Kubernetes :

- **Conteneur** : Port 80 (port interne du conteneur nginx)
- **Service** : Port 80 (expose le port 80 du conteneur)
- **Ingress** : Port 80 (route le trafic HTTP vers le service)
- **NetworkPolicy** : 
  - Port 443 (HTTPS) pour les appels API Dynatrace
  - Port 53 (UDP) pour la résolution DNS

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

L'Ingress est configuré pour :
- Rediriger tout le trafic HTTP vers le service
- Supporter le routage côté client de React
- Ne pas forcer la redirection HTTPS (configurable via l'annotation `ssl-redirect`)

2. Assurez-vous que votre cluster a un Ingress Controller installé :
```bash
# Pour nginx-ingress
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx
```

### Network Policies

La configuration inclut une NetworkPolicy qui :
- Restreint le trafic sortant aux API Dynatrace (port 443)
- Autorise le trafic DNS (port 53)
- Bloque tout autre trafic sortant
- S'applique aux pods avec le label `app: dynatrace-carto`

### Déploiement

1. Pousser l'image vers votre registre Docker :

```bash
# Tag de l'image
docker tag dynatrace-carto:latest votre-registry/dynatrace-carto:latest

# Push de l'image
docker push votre-registry/dynatrace-carto:latest
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
kubectl logs -l app=dynatrace-carto

# Vérifier l'état des secrets
kubectl get secrets dynatrace-carto-secrets

# Vérifier les NetworkPolicies
kubectl describe networkpolicy dynatrace-carto-network-policy
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

### Service

Le service est configuré en type LoadBalancer et expose l'application sur le port 80. Il fait le lien entre l'Ingress et le conteneur nginx.

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
- `REACT_APP_DYNATRACE_API_TOKEN` : Token d'authentification Dynatrace
- `REACT_APP_DYNATRACE_URL` : URL de l'instance Dynatrace

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