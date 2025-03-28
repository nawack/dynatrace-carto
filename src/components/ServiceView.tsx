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
  CircularProgress,
  Alert,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  SelectChangeEvent,
  Grid,
  List,
  ListItem,
  ListItemText,
  Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import { Service } from '../services/api';
import { fetchServices } from '../services/api';

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

interface ServiceViewProps {
  services: Service[];
}

const ServiceView: React.FC<ServiceViewProps> = ({ services: initialServices }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [services, setServices] = useState<Service[]>(initialServices);

  // Récupérer les types uniques
  const uniqueTypes = Array.from(new Set(services.map(service => service.type)));
  // Récupérer les statuts uniques
  const uniqueStatuses = Array.from(new Set(services.map(service => service.status)));
  // Récupérer tous les tags uniques
  const allTags = Array.from(new Set(services.flatMap(service => service.tags || [])));

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const fetchedServices = await fetchServices();
        setServices(fetchedServices);
        setError(null);
      } catch (error) {
        console.error('Erreur lors du chargement des services:', error);
        setError('Erreur lors du chargement des services');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filtrer les services selon les critères
  const filteredServices = services.filter(service => {
    const matchesType = !selectedType || service.type === selectedType;
    const matchesStatus = !selectedStatus || service.status === selectedStatus;
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => service.tags?.includes(tag));
    return matchesType && matchesStatus && matchesTags;
  });

  // Calculer la pagination
  const totalPages = Math.max(1, Math.ceil(filteredServices.length / itemsPerPage));
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedServices = filteredServices.slice(startIndex, startIndex + itemsPerPage);

  // Réinitialiser la page si elle dépasse le nombre total de pages
  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleItemsPerPageChange = (event: SelectChangeEvent<number>) => {
    const newItemsPerPage = Number(event.target.value);
    setItemsPerPage(newItemsPerPage);
    // Recalculer la page actuelle pour maintenir la position relative
    const newPage = Math.min(page, Math.ceil(filteredServices.length / newItemsPerPage));
    setPage(newPage);
  };

  const handleTypeChange = (event: SelectChangeEvent<string>) => {
    setSelectedType(event.target.value);
    setPage(1);
  };

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    setSelectedStatus(event.target.value);
    setPage(1);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
    setPage(1);
  };

  const handleRowClick = (service: Service) => {
    setSelectedService(service);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedService(null);
  };

  const getStatusColor = (status: string) => {
    if (status === 'ONLINE') return 'success';
    if (status === 'OFFLINE') return 'error';
    return 'warning';
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(filteredServices, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'services.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
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
          Services ({filteredServices.length})
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
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Technologie</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Mode de surveillance</TableCell>
              <TableCell>Dernière activité</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedServices.map((service) => (
              <TableRow 
                key={service.id}
                hover
                onClick={() => handleRowClick(service)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{service.name}</TableCell>
                <TableCell>{service.type}</TableCell>
                <TableCell>{service.technology}</TableCell>
                <TableCell>
                  <Chip 
                    label={service.status} 
                    color={getStatusColor(service.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{service.monitoringMode}</TableCell>
                <TableCell>
                  {service.lastSeenTimestamp > 0 
                    ? new Date(service.lastSeenTimestamp).toLocaleString('fr-FR')
                    : 'Jamais'}
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
          onChange={(_, value) => setPage(value)}
          color="primary"
          showFirstButton
          showLastButton
        />
      </Box>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Détails du service
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
          {selectedService && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Informations générales
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText 
                        primary="Nom" 
                        secondary={selectedService.name}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Type" 
                        secondary={selectedService.type}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Technologie" 
                        secondary={selectedService.technology}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Statut" 
                        secondary={selectedService.status}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Mode de monitoring" 
                        secondary={selectedService.monitoringMode}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Auto-injection" 
                        secondary={selectedService.autoInjection ? 'Oui' : 'Non'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Dernière activité" 
                        secondary={selectedService.lastSeenTimestamp > 0 
                          ? new Date(selectedService.lastSeenTimestamp).toLocaleString('fr-FR')
                          : 'Jamais'}
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Applications associées
                  </Typography>
                  <List>
                    {selectedService.applications?.map((appId, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={appId} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedService.tags?.map((tag, index) => (
                      <Chip key={index} label={tag} size="small" />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Propriétés
                  </Typography>
                  <List>
                    {Object.entries(selectedService.properties || {}).map(([key, value]) => (
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

export default ServiceView; 