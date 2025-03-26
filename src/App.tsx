import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
  LinearProgress,
  Typography,
  AppBar,
  Alert
} from '@mui/material';
import { HostView, ApplicationView, ApplicationCommunicationView, ServiceView, ProcessView, HostLinkView, ServiceLinkView, ProcessLinkView } from './components';
import { fetchApplications, fetchHosts, fetchLinks, Application, Host, Link, ApplicationCommunication, Service, fetchServices, fetchApplicationCommunications, fetchProcesses } from './services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255, 255, 255, 0.12)',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
          },
        },
      },
    },
  },
});

function App() {
  const [value, setValue] = useState(0);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [communications, setCommunications] = useState<ApplicationCommunication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [fetchedHosts, fetchedServices, fetchedApplications, fetchedProcesses, fetchedLinks] = await Promise.all([
          fetchHosts(),
          fetchServices(),
          fetchApplications(),
          fetchProcesses(),
          fetchLinks()
        ]);
        setHosts(fetchedHosts);
        setServices(fetchedServices);
        setApplications(fetchedApplications);
        setProcesses(fetchedProcesses);
        setLinks(fetchedLinks);
        setError(null);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  if (loading) {
    return <LinearProgress />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl">
        <Box sx={{ width: '100%', mt: 4 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom 
            sx={{ 
              color: 'primary.main',
              fontWeight: 'bold',
              mb: 3
            }}
          >
            Cartographie Dynatrace
          </Typography>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
              <Tab label="Hôtes" />
              <Tab label="Services" />
              <Tab label="Applications" />
              <Tab label="Processus" />
              <Tab label="Liens hôtes" />
              <Tab label="Liens services" />
              <Tab label="Liens processus" />
            </Tabs>
          </Box>
          <TabPanel value={value} index={0}>
            <HostView hosts={hosts} links={links} applications={applications} />
          </TabPanel>
          <TabPanel value={value} index={1}>
            <ServiceView services={services} />
          </TabPanel>
          <TabPanel value={value} index={2}>
            <ApplicationView applications={applications} hosts={hosts} links={links} />
          </TabPanel>
          <TabPanel value={value} index={3}>
            <ProcessView processes={processes} />
          </TabPanel>
          <TabPanel value={value} index={4}>
            <HostLinkView hosts={hosts} />
          </TabPanel>
          <TabPanel value={value} index={5}>
            <ServiceLinkView services={services} />
          </TabPanel>
          <TabPanel value={value} index={6}>
            <ProcessLinkView processes={processes} />
          </TabPanel>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App; 