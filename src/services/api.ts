import axios from 'axios';
import { API_CONFIG } from '../config/api';

const api = axios.create({
  baseURL: API_CONFIG.baseUrl,
  headers: API_CONFIG.headers
});

// Intercepteur pour logger les requêtes
api.interceptors.request.use(
  (config) => {
    console.log(`[Dynatrace API] Requête ${config.method?.toUpperCase()} vers ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[Dynatrace API] Erreur lors de la requête:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour logger les réponses
api.interceptors.response.use(
  (response) => {
    console.log(`[Dynatrace API] Réponse ${response.status} de ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`[Dynatrace API] Erreur ${error.response?.status || 'unknown'} de ${error.config?.url}:`, error.message);
    return Promise.reject(error);
  }
);

export interface Application {
  id: string;
  name: string;
  hosts: string[];
  type: string;
  tags: string[];
}

export interface Host {
  id: string;
  name: string;
  type: string;
  cpu: number;
  memory: number;
  disk: number;
  osType: string;
  osVersion: string;
  osArchitecture: string;
  ipAddresses: string[];
  hostname: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkThroughput: number;
  status: string;
  lastSeenTimestamp: number;
  monitoringMode: string;
  autoInjection: boolean;
  applications: string[];
  tags: string[];
  properties: {
    [key: string]: string;
  };
}

export interface Link {
  source: string;
  target: string;
  type: string;
  properties: {
    [key: string]: string;
  };
}

export interface ApplicationCommunication {
  sourceApp: string;
  targetApp: string;
  type: string;
  calls: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
}

export interface Service {
  id: string;
  name: string;
  type: string;
  technology: string;
  status: string;
  lastSeenTimestamp: number;
  monitoringMode: string;
  autoInjection: boolean;
  applications: string[];
  tags: string[];
  properties: {
    [key: string]: string;
  };
}

export const fetchApplications = async (): Promise<Application[]> => {
  console.log('[Dynatrace API] Récupération des applications...');
  const response = await api.get('/api/v2/entities', {
    params: {
      entitySelector: 'type("APPLICATION")',
      fields: '+properties,+tags'
    }
  });
  
  console.log(`[Dynatrace API] ${response.data.entities.length} applications récupérées`);
  return response.data.entities.map((entity: any) => ({
    id: entity.entityId,
    name: entity.displayName,
    hosts: entity.properties?.hosts || [],
    type: entity.type,
    tags: entity.tags || []
  }));
};

export const fetchHosts = async (): Promise<Host[]> => {
  console.log('[Dynatrace API] Récupération des hôtes...');
  const response = await api.get('/api/v2/entities', {
    params: {
      entitySelector: 'type("HOST")',
      fields: '+properties,+tags,+toRelationships,+fromRelationships'
    }
  });
  
  console.log(`[Dynatrace API] ${response.data.entities.length} hôtes récupérés`);
  return response.data.entities.map((entity: any) => {
    const properties = entity.properties || {};
    return {
      id: entity.entityId,
      name: entity.displayName,
      type: entity.type,
      cpu: parseFloat(properties.cpu || '0'),
      memory: parseFloat(properties.memory || '0'),
      disk: parseFloat(properties.disk || '0'),
      osType: properties.osType || '',
      osVersion: properties.osVersion || '',
      osArchitecture: properties.osArchitecture || '',
      ipAddresses: properties.ipAddresses ? properties.ipAddresses.split(',') : [],
      hostname: properties.hostname || '',
      cpuUsage: parseFloat(properties.cpuUsage || '0'),
      memoryUsage: parseFloat(properties.memoryUsage || '0'),
      diskUsage: parseFloat(properties.diskUsage || '0'),
      networkThroughput: parseFloat(properties.networkThroughput || '0'),
      status: properties.status || 'unknown',
      lastSeenTimestamp: parseInt(properties.lastSeenTimestamp || '0'),
      monitoringMode: properties.monitoringMode || 'unknown',
      autoInjection: properties.autoInjection === 'true',
      applications: entity.toRelationships
        ?.filter((rel: any) => rel.type === 'runs_on')
        .map((rel: any) => rel.toEntityId) || [],
      tags: entity.tags || [],
      properties: properties
    };
  });
};

export const fetchLinks = async (): Promise<Link[]> => {
  console.log('[Dynatrace API] Récupération des liens...');
  const response = await api.get('/api/v2/entities', {
    params: {
      entitySelector: 'type("APPLICATION"),type("HOST"),type("SERVICE")',
      fields: '+properties,+toRelationships,+fromRelationships'
    }
  });
  
  console.log(`[Dynatrace API] ${response.data.entities.length} entités récupérées`);
  const links: Link[] = [];
  
  response.data.entities.forEach((entity: any) => {
    // Traiter les relations sortantes
    const toRelationships = Array.isArray(entity.toRelationships) ? entity.toRelationships : [];
    toRelationships.forEach((rel: any) => {
      if (['runs_on', 'HTTP', 'REST', 'SOAP', 'gRPC', 'DATABASE', 'MESSAGING'].includes(rel.type)) {
        links.push({
          source: entity.entityId,
          target: rel.toEntityId,
          type: rel.type,
          properties: {
            ...rel.properties,
            sourceType: entity.type,
            targetType: rel.toEntityType
          }
        });
      }
    });

    // Traiter les relations entrantes
    const fromRelationships = Array.isArray(entity.fromRelationships) ? entity.fromRelationships : [];
    fromRelationships.forEach((rel: any) => {
      if (['runs_on', 'HTTP', 'REST', 'SOAP', 'gRPC', 'DATABASE', 'MESSAGING'].includes(rel.type)) {
        links.push({
          source: rel.fromEntityId,
          target: entity.entityId,
          type: rel.type,
          properties: {
            ...rel.properties,
            sourceType: rel.fromEntityType,
            targetType: entity.type
          }
        });
      }
    });
  });
  
  console.log(`[Dynatrace API] ${links.length} liens extraits`);
  return links;
};

export const fetchHostById = async (id: string): Promise<Host> => {
  console.log(`[Dynatrace API] Récupération des détails de l'hôte ${id}...`);
  const response = await api.get(`/api/v2/entities/${id}`, {
    params: {
      fields: '+properties,+tags,+toRelationships,+fromRelationships'
    }
  });
  
  console.log(`[Dynatrace API] Détails de l'hôte ${id} récupérés`);
  const entity = response.data;
  const properties = entity.properties || {};
  
  return {
    id: entity.entityId,
    name: entity.displayName,
    type: entity.type,
    cpu: parseFloat(properties.cpu || '0'),
    memory: parseFloat(properties.memory || '0'),
    disk: parseFloat(properties.disk || '0'),
    osType: properties.osType || '',
    osVersion: properties.osVersion || '',
    osArchitecture: properties.osArchitecture || '',
    ipAddresses: properties.ipAddresses ? properties.ipAddresses.split(',') : [],
    hostname: properties.hostname || '',
    cpuUsage: parseFloat(properties.cpuUsage || '0'),
    memoryUsage: parseFloat(properties.memoryUsage || '0'),
    diskUsage: parseFloat(properties.diskUsage || '0'),
    networkThroughput: parseFloat(properties.networkThroughput || '0'),
    status: properties.status || 'unknown',
    lastSeenTimestamp: parseInt(properties.lastSeenTimestamp || '0'),
    monitoringMode: properties.monitoringMode || 'unknown',
    autoInjection: properties.autoInjection === 'true',
    applications: entity.toRelationships
      ?.filter((rel: any) => rel.type === 'runs_on')
      .map((rel: any) => rel.toEntityId) || [],
    tags: entity.tags || [],
    properties: properties
  };
};

export const fetchApplicationById = async (id: string): Promise<Application> => {
  console.log(`[Dynatrace API] Récupération des détails de l'application ${id}...`);
  const response = await api.get(`/api/v2/entities/${id}`, {
    params: {
      fields: '+properties,+tags'
    }
  });
  
  console.log(`[Dynatrace API] Détails de l'application ${id} récupérés`);
  const entity = response.data;
  return {
    id: entity.entityId,
    name: entity.displayName,
    hosts: entity.properties?.hosts || [],
    type: entity.type,
    tags: entity.tags || []
  };
};

export const fetchApplicationCommunications = async (): Promise<ApplicationCommunication[]> => {
  console.log('[Dynatrace API] Récupération des communications entre applications...');
  const response = await api.get('/api/v2/entities', {
    params: {
      entitySelector: 'type("APPLICATION")',
      fields: '+properties,+toRelationships,+fromRelationships'
    }
  });
  
  console.log(`[Dynatrace API] ${response.data.entities.length} applications récupérées`);
  
  const communications: ApplicationCommunication[] = [];
  const communicationTypes = ['HTTP', 'REST', 'SOAP', 'gRPC', 'DATABASE', 'MESSAGING'];
  
  response.data.entities.forEach((entity: any) => {
    // Traiter les communications sortantes
    const fromRelationships = Array.isArray(entity.fromRelationships) ? entity.fromRelationships : [];
    fromRelationships.forEach((rel: any) => {
      if (communicationTypes.includes(rel.type)) {
        const targetApp = rel.toEntityId;
        communications.push({
          sourceApp: entity.entityId,
          targetApp: targetApp,
          type: rel.type,
          calls: parseInt(rel.properties?.calls || '0'),
          responseTime: parseFloat(rel.properties?.responseTime || '0'),
          errorRate: parseFloat(rel.properties?.errorRate || '0'),
          throughput: parseFloat(rel.properties?.throughput || '0')
        });
      }
    });

    // Traiter les communications entrantes
    const toRelationships = Array.isArray(entity.toRelationships) ? entity.toRelationships : [];
    toRelationships.forEach((rel: any) => {
      if (communicationTypes.includes(rel.type)) {
        const sourceApp = rel.fromEntityId;
        communications.push({
          sourceApp: sourceApp,
          targetApp: entity.entityId,
          type: rel.type,
          calls: parseInt(rel.properties?.calls || '0'),
          responseTime: parseFloat(rel.properties?.responseTime || '0'),
          errorRate: parseFloat(rel.properties?.errorRate || '0'),
          throughput: parseFloat(rel.properties?.throughput || '0')
        });
      }
    });
  });
  
  console.log(`[Dynatrace API] ${communications.length} communications traitées`);
  return communications;
};

export const fetchApplicationCommunicationDetails = async (
  sourceAppId: string,
  targetAppId: string
): Promise<ApplicationCommunication> => {
  console.log(`[Dynatrace API] Récupération des détails de communication entre ${sourceAppId} et ${targetAppId}...`);
  const response = await api.get(`/api/v2/entities/${sourceAppId}`, {
    params: {
      fields: '+properties,+fromRelationships'
    }
  });
  
  console.log(`[Dynatrace API] Détails de communication récupérés`);
  const entity = response.data;
  const relationships = Array.isArray(entity.fromRelationships) ? entity.fromRelationships : [];
  const rel = relationships.find((r: any) => r.toEntityId === targetAppId);
  
  if (!rel) {
    throw new Error('Relation non trouvée');
  }
  
  return {
    sourceApp: sourceAppId,
    targetApp: targetAppId,
    type: rel.type,
    calls: parseInt(rel.properties?.calls || '0'),
    responseTime: parseFloat(rel.properties?.responseTime || '0'),
    errorRate: parseFloat(rel.properties?.errorRate || '0'),
    throughput: parseFloat(rel.properties?.throughput || '0')
  };
};

export const fetchServices = async (): Promise<Service[]> => {
  console.log('[Dynatrace API] Récupération des services...');
  const response = await api.get('/api/v2/entities', {
    params: {
      entitySelector: 'type("SERVICE")',
      fields: '+properties,+tags,+toRelationships,+fromRelationships'
    }
  });
  
  console.log(`[Dynatrace API] ${response.data.entities.length} services récupérés`);
  return response.data.entities.map((entity: any) => {
    const properties = entity.properties || {};
    const toRelationships = Array.isArray(entity.toRelationships) ? entity.toRelationships : [];
    const applications = toRelationships
      .filter((rel: any) => rel.type === 'runs_on')
      .map((rel: any) => rel.toEntityId);

    return {
      id: entity.entityId,
      name: entity.displayName,
      type: entity.type,
      technology: properties.technology || '',
      status: properties.status || 'unknown',
      lastSeenTimestamp: parseInt(properties.lastSeenTimestamp || '0'),
      monitoringMode: properties.monitoringMode || 'unknown',
      autoInjection: properties.autoInjection === 'true',
      applications: applications,
      tags: entity.tags || [],
      properties: properties
    };
  });
}; 