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
  type: string;
  status: string;
  lastSeenTimestamp: number;
  hosts: string[];
  tags: string[];
  properties: Record<string, any>;
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
    [key: string]: string | undefined;
  };
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

export interface Process {
  id: string;
  name: string;
  type: string;
  status: string;
  lastSeenTimestamp: number;
  monitoringMode: string;
  autoInjection: boolean;
  host: string;
  tags: string[];
  properties: Record<string, any>;
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
  return response.data.entities.map((entity: any) => {
    const properties = entity.properties || {};
    const hosts = Array.isArray(properties.hosts) ? properties.hosts : [];
    
    return {
      id: entity.entityId,
      name: entity.displayName,
      hosts: hosts,
      type: entity.type,
      tags: entity.tags || [],
      status: properties.status || 'unknown',
      lastSeenTimestamp: parseInt(properties.lastSeenTimestamp || '0'),
      properties: properties
    };
  });
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
    const toRelationships = Array.isArray(entity.toRelationships) ? entity.toRelationships : [];
    const applications = toRelationships
      .filter((rel: any) => rel.type === 'runs_on')
      .map((rel: any) => rel.toEntityId);

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
      applications: applications,
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
      fields: '+properties,+tags,+toRelationships,+fromRelationships'
    }
  });
  
  console.log(`[Dynatrace API] ${response.data.entities.length} entités récupérées`);
  const links: Link[] = [];
  
  response.data.entities.forEach((entity: any) => {
    // Traiter les relations sortantes
    const toRelationships = Array.isArray(entity.toRelationships) ? entity.toRelationships : [];
    toRelationships.forEach((rel: any) => {
      if (['runs_on', 'HTTP', 'REST', 'SOAP', 'gRPC', 'DATABASE', 'MESSAGING', 'NETWORK'].includes(rel.type)) {
        links.push({
          source: entity.entityId,
          target: rel.toEntityId,
          type: rel.type,
          properties: {
            ...rel.properties,
            sourceType: entity.type,
            targetType: rel.toEntityType,
            status: rel.properties?.status || 'unknown',
            lastSeenTimestamp: rel.properties?.lastSeenTimestamp || '0',
            bandwidth: rel.properties?.bandwidth || '0',
            latency: rel.properties?.latency || '0',
            packetLoss: rel.properties?.packetLoss || '0',
            calls: rel.properties?.calls || '0',
            responseTime: rel.properties?.responseTime || '0',
            errorRate: rel.properties?.errorRate || '0',
            throughput: rel.properties?.throughput || '0'
          }
        });
      }
    });

    // Traiter les relations entrantes
    const fromRelationships = Array.isArray(entity.fromRelationships) ? entity.fromRelationships : [];
    fromRelationships.forEach((rel: any) => {
      if (['runs_on', 'HTTP', 'REST', 'SOAP', 'gRPC', 'DATABASE', 'MESSAGING', 'NETWORK'].includes(rel.type)) {
        links.push({
          source: rel.fromEntityId,
          target: entity.entityId,
          type: rel.type,
          properties: {
            ...rel.properties,
            sourceType: rel.fromEntityType,
            targetType: entity.type,
            status: rel.properties?.status || 'unknown',
            lastSeenTimestamp: rel.properties?.lastSeenTimestamp || '0',
            bandwidth: rel.properties?.bandwidth || '0',
            latency: rel.properties?.latency || '0',
            packetLoss: rel.properties?.packetLoss || '0',
            calls: rel.properties?.calls || '0',
            responseTime: rel.properties?.responseTime || '0',
            errorRate: rel.properties?.errorRate || '0',
            throughput: rel.properties?.throughput || '0'
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
  const toRelationships = Array.isArray(entity.toRelationships) ? entity.toRelationships : [];
  const applications = toRelationships
    .filter((rel: any) => rel.type === 'runs_on')
    .map((rel: any) => rel.toEntityId);
  
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
    applications: applications,
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
  const properties = entity.properties || {};
  const hosts = Array.isArray(properties.hosts) ? properties.hosts : [];
  
  return {
    id: entity.entityId,
    name: entity.displayName,
    hosts: hosts,
    type: entity.type,
    tags: entity.tags || [],
    status: properties.status || 'unknown',
    lastSeenTimestamp: parseInt(properties.lastSeenTimestamp || '0'),
    properties: properties
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

export const fetchProcesses = async (): Promise<Process[]> => {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/api/v2/entities?entitySelector=type(PROCESS)&from=-1h&to=now&fields=+properties,+tags,+relationships`, {
      headers: {
        'Authorization': `Api-Token ${API_CONFIG.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Nombre de processus récupérés: ${data.entities.length}`);

    return data.entities.map((entity: any) => ({
      id: entity.entityId,
      name: entity.displayName || entity.entityId,
      type: entity.type,
      status: entity.properties?.status || 'unknown',
      lastSeenTimestamp: parseInt(entity.properties?.lastSeenTimestamp || '0'),
      monitoringMode: entity.properties?.monitoringMode || 'unknown',
      autoInjection: entity.properties?.autoInjection || false,
      host: entity.properties?.host || '',
      tags: entity.tags || [],
      properties: entity.properties || {}
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des processus:', error);
    throw error;
  }
}; 