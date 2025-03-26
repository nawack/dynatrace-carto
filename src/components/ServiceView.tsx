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
  SelectChangeEvent
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Service, fetchServices } from '../services/api';

interface ServiceViewProps {
  services: Service[];
}

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50];

const ServiceView: React.FC<ServiceViewProps> = ({ services }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  // Récupérer les types uniques
  const uniqueTypes = Array.from(new Set(services.map(service => service.type)));
  // Récupérer les statuts uniques
  const uniqueStatuses = Array.from(new Set(services.map(service => service.status)));
  // Récupérer tous les tags uniques
  const allTags = Array.from(new Set(services.flatMap(service => service.tags)));

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchServices();
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des services:', error);
        setError('Erreur lors du chargement des services');
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
      selectedTags.every(tag => service.tags.includes(tag));
    return matchesType && matchesStatus && matchesTags;
  });

  // Calculer la pagination
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedServices = filteredServices.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleItemsPerPageChange = (event: SelectChangeEvent<number>) => {
    setItemsPerPage(Number(event.target.value));
    setPage(1);
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
    <Box>
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

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Éléments par page</InputLabel>
          <Select
            value={itemsPerPage}
            label="Éléments par page"
            onChange={handleItemsPerPageChange}
          >
            {ITEMS_PER_PAGE_OPTIONS.map(option => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Tags :</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
          {allTags.map(tag => (
            <Chip
              key={tag}
              label={tag}
              onClick={() => handleTagToggle(tag)}
              color={selectedTags.includes(tag) ? "primary" : "default"}
            />
          ))}
        </Stack>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Technologie</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Dernière activité</TableCell>
              <TableCell>Tags</TableCell>
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
                <TableCell>{service.status}</TableCell>
                <TableCell>
                  {new Date(service.lastSeenTimestamp).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                    {service.tags.map(tag => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack spacing={2} alignItems="center" sx={{ mt: 2 }}>
        <Pagination 
          count={totalPages} 
          page={page} 
          onChange={handlePageChange}
          color="primary"
          size="large"
        />
      </Stack>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Détails du service {selectedService?.name}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedService && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Informations générales
              </Typography>
              <Typography>ID: {selectedService.id}</Typography>
              <Typography>Type: {selectedService.type}</Typography>
              <Typography>Technologie: {selectedService.technology}</Typography>
              <Typography>Statut: {selectedService.status}</Typography>
              <Typography>
                Dernière activité: {new Date(selectedService.lastSeenTimestamp).toLocaleString()}
              </Typography>
              <Typography>Mode de monitoring: {selectedService.monitoringMode}</Typography>
              <Typography>Auto-injection: {selectedService.autoInjection ? 'Oui' : 'Non'}</Typography>

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Applications associées
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                {selectedService.applications.map(appId => (
                  <Chip
                    key={appId}
                    label={appId}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Stack>

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Tags
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                {selectedService.tags.map(tag => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Stack>

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Propriétés
              </Typography>
              {Object.entries(selectedService.properties).map(([key, value]) => (
                <Typography key={key}>
                  {key}: {value}
                </Typography>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ServiceView; 