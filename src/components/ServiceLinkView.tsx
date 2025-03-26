import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Button,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Stack,
  TextField,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Grid,
  IconButton,
  Alert
} from '@mui/material';
import { Service, Link, fetchServices, fetchLinks } from '../services/api';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 25, 50, 100];

interface ServiceLinkViewProps {
  services: Service[];
}

interface ServiceLink {
  id: string;
  sourceService: string;
  targetService: string;
  type: string;
  status: string;
  lastSeenTimestamp: number;
  properties: Record<string, any>;
}

const ServiceLinkView: React.FC<ServiceLinkViewProps> = ({ services: initialServices }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedLink, setSelectedLink] = useState<ServiceLink | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [serviceLinks, setServiceLinks] = useState<ServiceLink[]>([]);
  const [services, setServices] = useState<Service[]>(initialServices);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [fetchedServices, fetchedLinks] = await Promise.all([
          fetchServices(),
          fetchLinks()
        ]);
        setServices(fetchedServices);
        
        // Filtrer les liens pour ne garder que ceux entre services
        const serviceLinks = fetchedLinks
          .filter((link: Link) => link.properties.sourceType === 'SERVICE' && link.properties.targetType === 'SERVICE')
          .map((link: Link) => ({
            id: `${link.source}-${link.target}`,
            sourceService: link.source,
            targetService: link.target,
            type: link.type,
            status: link.properties.status || 'unknown',
            lastSeenTimestamp: parseInt(link.properties.lastSeenTimestamp || '0'),
            properties: {
              ...link.properties,
              calls: link.properties.calls || '0',
              responseTime: link.properties.responseTime || '0',
              errorRate: link.properties.errorRate || '0',
              throughput: link.properties.throughput || '0'
            }
          }));
        
        setServiceLinks(serviceLinks);
        setError(null);
      } catch (error) {
        console.error('Erreur lors du chargement des liens entre services:', error);
        setError('Erreur lors du chargement des liens entre services');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getServiceName = (serviceId: string): string => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : serviceId;
  };

  // Récupérer les types uniques de liens
  const uniqueTypes = Array.from(new Set(serviceLinks.map(link => link.type)));
  // Récupérer les statuts uniques
  const uniqueStatuses = Array.from(new Set(serviceLinks.map(link => link.status)));

  // Filtrer les liens selon les critères
  const filteredLinks = serviceLinks.filter(link => {
    const matchesType = !selectedType || link.type === selectedType;
    const matchesStatus = !selectedStatus || link.status === selectedStatus;
    return matchesType && matchesStatus;
  });

  // Calculer la pagination
  const totalPages = Math.max(1, Math.ceil(filteredLinks.length / itemsPerPage));
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedLinks = filteredLinks.slice(startIndex, startIndex + itemsPerPage);

  // Réinitialiser la page si elle dépasse le nombre total de pages
  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages]);

  const handleExportJson = () => {
    const dataStr = JSON.stringify(filteredLinks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'service-links.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleTypeChange = (event: SelectChangeEvent<string>) => {
    setSelectedType(event.target.value);
    setPage(1);
  };

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    setSelectedStatus(event.target.value);
    setPage(1);
  };

  const handleItemsPerPageChange = (event: SelectChangeEvent<number>) => {
    const newItemsPerPage = Number(event.target.value);
    setItemsPerPage(newItemsPerPage);
    const newPage = Math.min(page, Math.ceil(filteredLinks.length / newItemsPerPage));
    setPage(newPage);
  };

  const handleRowClick = (link: ServiceLink) => {
    setSelectedLink(link);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLink(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Liens entre services ({filteredLinks.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExportJson}
        >
          Exporter JSON
        </Button>
      </Box>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={selectedType}
            label="Type"
            onChange={handleTypeChange}
          >
            <MenuItem value="">Tous</MenuItem>
            {uniqueTypes.map(type => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Statut</InputLabel>
          <Select
            value={selectedStatus}
            label="Statut"
            onChange={handleStatusChange}
          >
            <MenuItem value="">Tous</MenuItem>
            {uniqueStatuses.map(status => (
              <MenuItem key={status} value={status}>{status}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 100 }}>
          <InputLabel>Par page</InputLabel>
          <Select
            value={itemsPerPage}
            label="Par page"
            onChange={handleItemsPerPageChange}
          >
            {ITEMS_PER_PAGE_OPTIONS.map(option => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Service source</TableCell>
              <TableCell>Service cible</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Dernière activité</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedLinks.map((link) => (
              <TableRow 
                key={link.id}
                onClick={() => handleRowClick(link)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{getServiceName(link.sourceService)}</TableCell>
                <TableCell>{getServiceName(link.targetService)}</TableCell>
                <TableCell>
                  <Chip label={link.type} size="small" />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={link.status}
                    color={link.status === 'ONLINE' ? 'success' : 
                           link.status === 'OFFLINE' ? 'error' : 
                           'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(link.lastSeenTimestamp).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination 
          count={totalPages} 
          page={page} 
          onChange={(event, value) => setPage(value)}
          color="primary"
          showFirstButton
          showLastButton
          size="large"
        />
      </Box>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Détails du lien
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedLink && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Informations générales
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText 
                        primary="Service source" 
                        secondary={getServiceName(selectedLink.sourceService)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Service cible" 
                        secondary={getServiceName(selectedLink.targetService)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Type" 
                        secondary={selectedLink.type}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Statut" 
                        secondary={selectedLink.status}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Dernière activité" 
                        secondary={new Date(selectedLink.lastSeenTimestamp).toLocaleString()}
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Métriques de performance
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText 
                        primary="Appels" 
                        secondary={selectedLink.properties.calls}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Temps de réponse" 
                        secondary={selectedLink.properties.responseTime}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Taux d'erreur" 
                        secondary={selectedLink.properties.errorRate}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Débit" 
                        secondary={selectedLink.properties.throughput}
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Propriétés
                  </Typography>
                  <List>
                    {Object.entries(selectedLink.properties || {}).map(([key, value]) => (
                      <ListItem key={key}>
                        <ListItemText 
                          primary={key} 
                          secondary={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ServiceLinkView; 