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
  List,
  ListItem,
  ListItemText,
  Alert,
  CircularProgress,
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

const ApplicationView: React.FC<ApplicationViewProps> = ({ applications: initialApplications }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [applications, setApplications] = useState<Application[]>(initialApplications);

  // Récupérer les types uniques
  const uniqueTypes = Array.from(new Set(applications.map(app => app.type)));
  // Récupérer les statuts uniques
  const uniqueStatuses = Array.from(new Set(applications.map(app => app.status)));
  // Récupérer tous les tags uniques
  const allTags = Array.from(new Set(applications.flatMap(app => app.tags || [])));

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const fetchedApplications = await fetchApplications();
        setApplications(fetchedApplications);
        setError(null);
      } catch (error) {
        console.error('Erreur lors du chargement des applications:', error);
        setError('Erreur lors du chargement des applications');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filtrer les applications selon les critères
  const filteredApplications = applications.filter(app => {
    const matchesType = !selectedType || app.type === selectedType;
    const matchesStatus = !selectedStatus || app.status === selectedStatus;
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => app.tags?.includes(tag));
    return matchesType && matchesStatus && matchesTags;
  });

  // Calculer la pagination
  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / itemsPerPage));
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedApplications = filteredApplications.slice(startIndex, startIndex + itemsPerPage);

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
    const newPage = Math.min(page, Math.ceil(filteredApplications.length / newItemsPerPage));
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

  const handleRowClick = (application: Application) => {
    setSelectedApplication(application);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedApplication(null);
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
      <Typography variant="h6" gutterBottom>
        Applications ({filteredApplications.length})
      </Typography>

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
          <InputLabel>Tags</InputLabel>
          <Select
            multiple
            value={selectedTags}
            label="Tags"
            onChange={(e) => setSelectedTags(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
          >
            {allTags.map(tag => (
              <MenuItem key={tag} value={tag}>{tag}</MenuItem>
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
              <TableCell>Dernière activité</TableCell>
              <TableCell>Tags</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedApplications.map((application) => (
              <TableRow 
                key={application.id}
                onClick={() => handleRowClick(application)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{application.name}</TableCell>
                <TableCell>{application.type}</TableCell>
                <TableCell>
                  <Chip 
                    label={application.status}
                    color={application.status === 'ONLINE' ? 'success' : 
                           application.status === 'OFFLINE' ? 'error' : 
                           'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(application.lastSeenTimestamp).toLocaleString()}
                </TableCell>
                <TableCell>
                  {application.tags?.map((tag, index) => (
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

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination 
          count={totalPages} 
          page={page} 
          onChange={handlePageChange}
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
          Détails de l'application
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
          {selectedApplication && (
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
                        secondary={selectedApplication.name}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Type" 
                        secondary={selectedApplication.type}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Statut" 
                        secondary={selectedApplication.status}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Dernière activité" 
                        secondary={new Date(selectedApplication.lastSeenTimestamp).toLocaleString()}
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Hôtes associés
                  </Typography>
                  <List>
                    {selectedApplication.hosts?.map((hostId, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={hostId} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedApplication.tags?.map((tag, index) => (
                      <Chip key={index} label={tag} />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Propriétés
                  </Typography>
                  <List>
                    {Object.entries(selectedApplication.properties || {}).map(([key, value]) => (
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

export default ApplicationView;