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
import { Process, fetchProcesses } from '../services/api';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 25, 50, 100];

interface ProcessViewProps {
  processes: Process[];
}

const ProcessView: React.FC<ProcessViewProps> = ({ processes: initialProcesses }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [processes, setProcesses] = useState<Process[]>(initialProcesses);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const fetchedProcesses = await fetchProcesses();
        setProcesses(fetchedProcesses);
        setError(null);
      } catch (error) {
        console.error('Erreur lors du chargement des processus:', error);
        setError('Erreur lors du chargement des processus');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Récupérer les types uniques
  const uniqueTypes = Array.from(new Set(processes.map(process => process.type)));
  // Récupérer les statuts uniques
  const uniqueStatuses = Array.from(new Set(processes.map(process => process.status)));

  // Filtrer les processus selon les critères
  const filteredProcesses = processes.filter(process => {
    const matchesType = !selectedType || process.type === selectedType;
    const matchesStatus = !selectedStatus || process.status === selectedStatus;
    return matchesType && matchesStatus;
  });

  // Calculer la pagination
  const totalPages = Math.max(1, Math.ceil(filteredProcesses.length / itemsPerPage));
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedProcesses = filteredProcesses.slice(startIndex, startIndex + itemsPerPage);

  // Réinitialiser la page si elle dépasse le nombre total de pages
  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages]);

  const handleExportJson = () => {
    const dataStr = JSON.stringify(filteredProcesses, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'processes.json';

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
    const newPage = Math.min(page, Math.ceil(filteredProcesses.length / newItemsPerPage));
    setPage(newPage);
  };

  const handleRowClick = (process: Process) => {
    setSelectedProcess(process);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProcess(null);
  };

  const renderProcessDetails = (process: Process) => (
    <Box>
      <Typography variant="h6" gutterBottom>Informations générales</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2">
            <strong>ID:</strong> {process.id}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2">
            <strong>Nom:</strong> {process.name}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2">
            <strong>Type:</strong> {process.type}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2">
            <strong>Statut:</strong> {process.status}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2">
            <strong>Mode de surveillance:</strong> {process.monitoringMode}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2">
            <strong>Injection automatique:</strong> {process.autoInjection ? 'Oui' : 'Non'}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2">
            <strong>Hôte:</strong> {process.host}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2">
            <strong>Dernière observation:</strong> {new Date(process.lastSeenTimestamp).toLocaleString()}
          </Typography>
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Informations techniques</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2">
            <strong>PID:</strong> {process.pid}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2">
            <strong>Type de processus:</strong> {process.processType}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2">
            <strong>Méthode de détection:</strong> {process.detectionMethod}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2">
            <strong>Ligne de commande:</strong> {process.commandLine}
          </Typography>
        </Grid>
      </Grid>

      {process.softwareTechnologies.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Technologies logicielles</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {process.softwareTechnologies.map((tech, index) => (
              <Chip key={index} label={tech} size="small" />
            ))}
          </Box>
        </>
      )}

      {process.tags.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Tags</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {process.tags.map((tag, index) => (
              <Chip key={index} label={tag} size="small" />
            ))}
          </Box>
        </>
      )}

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Propriétés supplémentaires</Typography>
      <Table size="small">
        <TableBody>
          {Object.entries(process.properties).map(([key, value]) => (
            <TableRow key={key}>
              <TableCell component="th" scope="row">{key}</TableCell>
              <TableCell>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );

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
          Processus ({filteredProcesses.length})
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
              <TableCell>Nom</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Mode de surveillance</TableCell>
              <TableCell>Dernière activité</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedProcesses.map((process) => (
              <TableRow 
                key={process.id}
                onClick={() => handleRowClick(process)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{process.name}</TableCell>
                <TableCell>
                  <Chip label={process.type} size="small" />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={process.status}
                    color={process.status === 'ONLINE' ? 'success' : 
                           process.status === 'OFFLINE' ? 'error' : 
                           'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={process.monitoringMode}
                    color={process.monitoringMode === 'FULL_STACK' ? 'primary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(process.lastSeenTimestamp).toLocaleString()}
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
          Détails du processus
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
          {selectedProcess && (
            renderProcessDetails(selectedProcess)
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ProcessView; 