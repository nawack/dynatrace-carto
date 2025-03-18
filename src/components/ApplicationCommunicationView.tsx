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
  LinearProgress
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

  const handleExportJson = () => {
    const dataStr = JSON.stringify(communications, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'communications.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
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
            {communications.map((comm, index) => (
              <TableRow key={index}>
                <TableCell>{getApplicationName(comm.sourceApp)}</TableCell>
                <TableCell>{getApplicationName(comm.targetApp)}</TableCell>
                <TableCell>
                  <Chip label={comm.type} size="small" />
                </TableCell>
                <TableCell>{comm.calls}</TableCell>
                <TableCell>{comm.responseTime.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip 
                    label={`${comm.errorRate.toFixed(2)}%`}
                    color={comm.errorRate > 5 ? 'error' : 'success'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{comm.throughput.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ApplicationCommunicationView;