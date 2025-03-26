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
  Autocomplete
} from '@mui/material';
import { Application, ApplicationCommunication, fetchApplicationCommunications } from '../services/api';
import DownloadIcon from '@mui/icons-material/Download';

interface ApplicationCommunicationViewProps {
  applications: Application[];
}

const ApplicationCommunicationView: React.FC<ApplicationCommunicationViewProps> = ({ applications }) => {
  const [communications, setCommunications] = useState<ApplicationCommunication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSourceApp, setSelectedSourceApp] = useState<string>('');
  const [selectedTargetApp, setSelectedTargetApp] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [errorRateThreshold, setErrorRateThreshold] = useState<number>(5);

  useEffect(() => {
    const fetchCommunications = async () => {
      try {
        const data = await fetchApplicationCommunications();
        setCommunications(data);
      } catch (error) {
        console.error('Erreur lors du chargement des communications:', error);
        setError('Erreur lors du chargement des communications');
      } finally {
        setLoading(false);
      }
    };

    fetchCommunications();
  }, []);

  const getApplicationName = (appId: string): string => {
    const app = applications.find(a => a.id === appId);
    return app ? app.name : appId;
  };

  // Récupérer les types uniques de communication
  const uniqueTypes = Array.from(new Set(communications.map(comm => comm.type)));

  // Filtrer les communications selon les critères
  const filteredCommunications = communications.filter(comm => {
    const matchesSource = !selectedSourceApp || comm.sourceApp === selectedSourceApp;
    const matchesTarget = !selectedTargetApp || comm.targetApp === selectedTargetApp;
    const matchesType = !selectedType || comm.type === selectedType;
    const matchesErrorRate = comm.errorRate <= errorRateThreshold;
    return matchesSource && matchesTarget && matchesType && matchesErrorRate;
  });

  const handleExportJson = () => {
    const dataStr = JSON.stringify(filteredCommunications, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'communications.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleSourceAppChange = (event: SelectChangeEvent<string>) => {
    setSelectedSourceApp(event.target.value);
  };

  const handleTargetAppChange = (event: SelectChangeEvent<string>) => {
    setSelectedTargetApp(event.target.value);
  };

  const handleTypeChange = (event: SelectChangeEvent<string>) => {
    setSelectedType(event.target.value);
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
          Communications entre applications
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
          <InputLabel>Application source</InputLabel>
          <Select
            value={selectedSourceApp}
            label="Application source"
            onChange={handleSourceAppChange}
          >
            <MenuItem value="">Toutes</MenuItem>
            {applications.map(app => (
              <MenuItem key={app.id} value={app.id}>{app.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Application cible</InputLabel>
          <Select
            value={selectedTargetApp}
            label="Application cible"
            onChange={handleTargetAppChange}
          >
            <MenuItem value="">Toutes</MenuItem>
            {applications.map(app => (
              <MenuItem key={app.id} value={app.id}>{app.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

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

        <TextField
          label="Seuil d'erreur (%)"
          type="number"
          value={errorRateThreshold}
          onChange={(e) => setErrorRateThreshold(Number(e.target.value))}
          sx={{ minWidth: 150 }}
        />
      </Stack>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Application source</TableCell>
              <TableCell>Application cible</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Appels</TableCell>
              <TableCell>Temps de réponse (ms)</TableCell>
              <TableCell>Taux d'erreur (%)</TableCell>
              <TableCell>Débit (req/s)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCommunications.map((comm, index) => (
              <TableRow key={index}>
                <TableCell>{getApplicationName(comm.sourceApp)}</TableCell>
                <TableCell>{getApplicationName(comm.targetApp)}</TableCell>
                <TableCell>
                  <Chip label={comm.type} size="small" />
                </TableCell>
                <TableCell>{comm.calls.toLocaleString()}</TableCell>
                <TableCell>{comm.responseTime.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip 
                    label={`${comm.errorRate.toFixed(2)}%`}
                    color={comm.errorRate > errorRateThreshold ? 'error' : 'success'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{comm.throughput.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredCommunications.length === 0 && (
        <Typography variant="body1" color="text.secondary" align="center">
          Aucune communication trouvée avec les filtres actuels
        </Typography>
      )}
    </Box>
  );
};

export default ApplicationCommunicationView;