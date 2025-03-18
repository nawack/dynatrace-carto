import axios from 'axios';
import { API_CONFIG } from '../config/api';

const api = axios.create({
  baseURL: API_CONFIG.baseUrl,
  headers: API_CONFIG.headers
});

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

export const fetchApplications = async (): Promise<Application[]> => {
  const response = await api.get('/api/v2/entities', {
    params: {
      entitySelector: 'type("APPLICATION")',
      fields: '+properties,+tags'
    }
  });
  
  return response.data.entities.map((entity: any) => ({
    id: entity.entityId,
    name: entity.displayName,
    hosts: entity.properties?.hosts || [],
    type: entity.type,
    tags: entity.tags || []
  }));
};

export const fetchHosts = async (): Promise<Host[]> => {
  const response = await api.get('/api/v2/entities', {
    params: {
      entitySelector: 'type("HOST")',
      fields: '+properties,+tags,+toRelationships,+fromRelationships'
    }
  });
  
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
  const response = await api.get('/api/v2/topology', {
    params: {
      entitySelector: 'type("APPLICATION"),type("HOST")',
      fields: '+properties'
    }
  });
  
  return response.data.relationships.map((rel: any) => ({
    source: rel.fromEntityId,
    target: rel.toEntityId,
    type: rel.type,
    properties: rel.properties || {}
  }));
};

export const fetchHostById = async (id: string): Promise<Host> => {
  const response = await api.get(`/api/v2/entities/${id}`, {
    params: {
      fields: '+properties,+tags,+toRelationships,+fromRelationships'
    }
  });
  
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
  const response = await api.get(`/api/v2/entities/${id}`, {
    params: {
      fields: '+properties,+tags'
    }
  });
  
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
  console.log('Fetching application communications...');
  const response = await api.get('/api/v2/topology', {
    params: {
      entitySelector: 'type("APPLICATION")',
      fields: '+properties,+toRelationships,+fromRelationships'
    }
  });
  
  console.log('Received topology response:', response.data);
  
  const communications: ApplicationCommunication[] = [];
  
  response.data.entities.forEach((entity: any) => {
    // Vérifier les relations sortantes (fromRelationships)
    entity.fromRelationships?.forEach((rel: any) => {
      if (rel.type === 'HTTP' || rel.type === 'REST' || rel.type === 'SOAP' || rel.type === 'gRPC') {
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
  });
  
  console.log(`Processed ${communications.length} communications`);
  return communications;
};

export const fetchApplicationCommunicationDetails = async (
  sourceAppId: string,
  targetAppId: string
): Promise<ApplicationCommunication> => {
  const response = await api.get(`/api/v2/topology/${sourceAppId}/${targetAppId}`, {
    params: {
      fields: '+properties'
    }
  });
  
  const rel = response.data;
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