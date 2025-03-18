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
  Pagination,
  Stack,
  TextField,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
} from '@mui/material';
import { Application, Host, Link, fetchApplications } from '../services/api';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';

interface ApplicationViewProps {
  applications: Application[];
  hosts: Host[];
  links: Link[];
}

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50];

const ApplicationView: React.FC<ApplicationViewProps> = ({ applications, hosts, links }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedHostStatus, setSelectedHostStatus] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedHost, setSelectedHost] = useState<Host | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  // Récupérer les statuts uniques des hôtes
  const uniqueHostStatuses = Array.from(new Set(hosts.map(host => host.status)));
  // Récupérer tous les tags uniques
  const allTags = Array.from(new Set(applications.flatMap(app => app.tags)));

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchApplications();
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des applications:', error);
        setError('Erreur lors du chargement des applications');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filtrer les applications selon les critères
  const filteredApplications = applications.filter(app => {
    const matchesHostStatus = !selectedHostStatus || 
      app.hosts.some(hostId => {
        const host = hosts.find(h => h.id === hostId);
        return host && host.status === selectedHostStatus;
      });
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => app.tags.includes(tag));
    return matchesHostStatus && matchesTags;
  });

  // Calculer la pagination
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedApplications = filteredApplications.slice(startIndex, startIndex + itemsPerPage);

  // Obtenir les noms des hôtes associés à une application
  const getHostNames = (hostIds: string[]) => {
    return hostIds.map(id => {
      const host = hosts.find(h => h.id === id);
      return host ? host.name : id;
    });
  };

  // Obtenir le statut d'un hôte
  const getHostStatus = (hostId: string) => {
    const host = hosts.find(h => h.id === hostId);
    return host ? host.status : 'UNKNOWN';
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(applications, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'applications.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleItemsPerPageChange = (event: SelectChangeEvent<number>) => {
    setItemsPerPage(Number(event.target.value));
    setPage(1); // Réinitialiser à la première page
  };

  const handleOpenDialog = (hostId: string) => {
    const host = hosts.find(h => h.id === hostId);
    if (host) {
      setSelectedHost(host);
      setOpenDialog(true);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedHost(null);
  };

  if (loading) {
    return <LinearProgress />;
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Applications
        </Typography>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExportJson}
        >
          Exporter JSON
        </Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>État des hôtes</InputLabel>
            <Select
              value={selectedHostStatus}
              onChange={(e) => setSelectedHostStatus(e.target.value)}
              label="État des hôtes"
            >
              <MenuItem value="">Tous</MenuItem>
              {uniqueHostStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Autocomplete
            multiple
            options={allTags}
            value={selectedTags}
            onChange={(_, newValue) => setSelectedTags(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tags"
                placeholder="Sélectionner des tags"
              />
            )}
            sx={{ minWidth: 200 }}
          />

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Applications par page</InputLabel>
            <Select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              label="Applications par page"
            >
              {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          {filteredApplications.length} applications trouvées
        </Typography>
      </Paper>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Nombre d'hôtes</TableCell>
              <TableCell>Hôtes</TableCell>
              <TableCell>Tags</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedApplications.map((app) => (
              <TableRow key={app.id}>
                <TableCell>{app.name}</TableCell>
                <TableCell>{app.hosts.length}</TableCell>
                <TableCell>
                  {app.hosts.map((hostId, index) => {
                    const status = getHostStatus(hostId);
                    const hostName = getHostNames([hostId])[0];
                    return (
                      <Chip
                        key={index}
                        label={hostName}
                        size="small"
                        onClick={() => handleOpenDialog(hostId)}
                        sx={{ 
                          mr: 0.5, 
                          mb: 0.5,
                          backgroundColor: status === 'ONLINE' ? 'success.main' : 
                                        status === 'OFFLINE' ? 'error.main' : 
                                        'warning.main',
                          color: 'white',
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: status === 'ONLINE' ? 'success.dark' : 
                                          status === 'OFFLINE' ? 'error.dark' : 
                                          'warning.dark',
                          }
                        }}
                      />
                    );
                  })}
                </TableCell>
                <TableCell>
                  {app.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
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
              Détails de l'hôte {selectedHost?.name}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedHost && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                <Typography>{selectedHost.type}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">OS</Typography>
                <Typography>{`${selectedHost.osType} ${selectedHost.osVersion}`}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="subtitle2" color="text.secondary">CPU</Typography>
                <Typography>{`${selectedHost.cpuUsage.toFixed(1)}%`}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="subtitle2" color="text.secondary">Mémoire</Typography>
                <Typography>{`${selectedHost.memoryUsage.toFixed(1)}%`}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="subtitle2" color="text.secondary">Disque</Typography>
                <Typography>{`${selectedHost.diskUsage.toFixed(1)}%`}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip 
                  label={selectedHost.status}
                  color={selectedHost.status === 'ONLINE' ? 'success' : 
                         selectedHost.status === 'OFFLINE' ? 'error' : 'warning'}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Tags</Typography>
                <Box sx={{ mt: 0.5 }}>
                  {selectedHost.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicationView;