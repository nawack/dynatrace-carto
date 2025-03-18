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
  OutlinedInput,
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
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Host, Link, fetchHosts, Application } from '../services/api';
import DownloadIcon from '@mui/icons-material/Download';
import AppsIcon from '@mui/icons-material/Apps';
import CloseIcon from '@mui/icons-material/Close';

interface HostViewProps {
  hosts: Host[];
  links: Link[];
  applications: Application[];
}

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50];

const HostView: React.FC<HostViewProps> = ({ hosts, links, applications }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedHost, setSelectedHost] = useState<Host | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  // Récupérer les types uniques
  const uniqueTypes = Array.from(new Set(hosts.map(host => host.type)));
  // Récupérer les statuts uniques
  const uniqueStatuses = Array.from(new Set(hosts.map(host => host.status)));
  // Récupérer tous les tags uniques
  const allTags = Array.from(new Set(hosts.flatMap(host => host.tags)));

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchHosts();
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des hôtes:', error);
        setError('Erreur lors du chargement des hôtes');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filtrer les hôtes selon les critères
  const filteredHosts = hosts.filter(host => {
    const matchesType = !selectedType || host.type === selectedType;
    const matchesStatus = !selectedStatus || host.status === selectedStatus;
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => host.tags.includes(tag));
    return matchesType && matchesStatus && matchesTags;
  });

  // Calculer la pagination
  const totalPages = Math.ceil(filteredHosts.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedHosts = filteredHosts.slice(startIndex, startIndex + itemsPerPage);

  // Obtenir les applications associées à un hôte
  const getHostApplications = (hostId: string) => {
    return applications.filter(app => app.hosts.includes(hostId));
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(hosts, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'hosts.json';

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

  const handleOpenDialog = (host: Host) => {
    setSelectedHost(host);
    setOpenDialog(true);
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
          Hôtes
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
            <InputLabel>Type</InputLabel>
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              label="Type"
            >
              <MenuItem value="">Tous</MenuItem>
              {uniqueTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="">Tous</MenuItem>
              {uniqueStatuses.map((status) => (
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
            <InputLabel>Hôtes par page</InputLabel>
            <Select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              label="Hôtes par page"
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
          {filteredHosts.length} hôtes trouvés
        </Typography>
      </Paper>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>OS</TableCell>
              <TableCell>CPU</TableCell>
              <TableCell>Mémoire</TableCell>
              <TableCell>Disque</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedHosts.map((host) => (
              <TableRow key={host.id}>
                <TableCell>{host.name}</TableCell>
                <TableCell>{host.type}</TableCell>
                <TableCell>{`${host.osType} ${host.osVersion}`}</TableCell>
                <TableCell>{`${host.cpuUsage.toFixed(1)}%`}</TableCell>
                <TableCell>{`${host.memoryUsage.toFixed(1)}%`}</TableCell>
                <TableCell>{`${host.diskUsage.toFixed(1)}%`}</TableCell>
                <TableCell>
                  <Chip 
                    label={host.status}
                    color={host.status === 'ONLINE' ? 'success' : host.status === 'OFFLINE' ? 'error' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {host.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(host)}
                    title="Voir les applications"
                  >
                    <AppsIcon />
                  </IconButton>
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
              Applications sur {selectedHost?.name}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            {selectedHost && getHostApplications(selectedHost.id).map((app) => (
              <ListItem key={app.id}>
                <ListItemText
                  primary={app.name}
                  secondary={`Type: ${app.type}`}
                />
              </ListItem>
            ))}
            {selectedHost && getHostApplications(selectedHost.id).length === 0 && (
              <ListItem>
                <ListItemText
                  primary="Aucune application associée"
                  secondary="Cet hôte n'a pas d'applications"
                />
              </ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HostView;