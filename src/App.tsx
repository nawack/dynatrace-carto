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
  Alert,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Toolbar,
  Divider
} from '@mui/material';
import {
  Computer as ComputerIcon,
  Apps as AppsIcon,
  Storage as StorageIcon,
  AccountTree as AccountTreeIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { HostView, ApplicationView, ServiceView, ProcessView, HostLinkView, ServiceLinkView, ProcessLinkView } from './components';
import { fetchApplications, fetchHosts, fetchLinks, Application, Host, Link, Service, Process, fetchServices, fetchProcesses } from './services/api';

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
      main: '#00B4D2',
      light: '#48CAE4',
      dark: '#0096C7',
    },
    secondary: {
      main: '#FF6B6B',
      light: '#FF8E8E',
      dark: '#FF5252',
    },
    background: {
      default: '#0A1929',
      paper: '#132F4C',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.7)',
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
            backgroundColor: 'rgba(0, 180, 210, 0.08)',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#132F4C',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0A1929',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 180, 210, 0.16)',
            '&:hover': {
              backgroundColor: 'rgba(0, 180, 210, 0.24)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 180, 210, 0.16)',
          color: '#48CAE4',
          '&.MuiChip-colorSuccess': {
            backgroundColor: 'rgba(0, 200, 81, 0.16)',
            color: '#00C851',
          },
          '&.MuiChip-colorError': {
            backgroundColor: 'rgba(255, 107, 107, 0.16)',
            color: '#FF6B6B',
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 180, 210, 0.12)',
        },
        bar: {
          backgroundColor: '#00B4D2',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '24px !important',
          paddingRight: '24px !important',
        },
      },
    },
  },
});

function App() {
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(true);

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

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const drawerWidth = 240;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              Dynatrace Cartography
            </Typography>
          </Toolbar>
        </AppBar>

        <Drawer
          variant="persistent"
          anchor="left"
          open={drawerOpen}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              backgroundColor: '#132F4C',
            },
          }}
        >
          <Toolbar>
            <Box sx={{ width: '100%', textAlign: 'center' }}>
              <Box
                component="img"
                src={`${process.env.PUBLIC_URL}/logo1.png`}
                alt="Logo"
                onError={(e) => {
                  console.error('Erreur de chargement du logo:', e);
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMwMEI0RDIiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGR5PSIuM2VtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZmZmIiBmb250LXNpemU9IjIwIj5EeW5hQ2FydG88L3RleHQ+PC9zdmc+';
                }}
                sx={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: 60,
                  objectFit: 'contain',
                  mb: 1
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  color: '#00B4D2',
                  fontWeight: 'bold',
                  letterSpacing: 1,
                  textTransform: 'uppercase'
                }}
              >
                DynaCarto
              </Typography>
            </Box>
          </Toolbar>
          <Divider />
          <List>
            <ListItem button onClick={() => setValue(0)} selected={value === 0}>
              <ListItemIcon>
                <ComputerIcon sx={{ color: value === 0 ? '#00B4D2' : 'inherit' }} />
              </ListItemIcon>
              <ListItemText primary="Hôtes" />
            </ListItem>
            <ListItem button onClick={() => setValue(1)} selected={value === 1}>
              <ListItemIcon>
                <AppsIcon sx={{ color: value === 1 ? '#00B4D2' : 'inherit' }} />
              </ListItemIcon>
              <ListItemText primary="Applications" />
            </ListItem>
            <ListItem button onClick={() => setValue(2)} selected={value === 2}>
              <ListItemIcon>
                <StorageIcon sx={{ color: value === 2 ? '#00B4D2' : 'inherit' }} />
              </ListItemIcon>
              <ListItemText primary="Services" />
            </ListItem>
            <ListItem button onClick={() => setValue(3)} selected={value === 3}>
              <ListItemIcon>
                <AccountTreeIcon sx={{ color: value === 3 ? '#00B4D2' : 'inherit' }} />
              </ListItemIcon>
              <ListItemText primary="Processus" />
            </ListItem>
          </List>
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            minHeight: '100vh',
            backgroundColor: '#0A1929',
            overflow: 'auto'
          }}
        >
          <Toolbar />
          {loading && <LinearProgress />}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ 
            p: 3,
            backgroundColor: '#132F4C',
            borderRadius: 1,
            boxShadow: 1
          }}>
            <TabPanel value={value} index={0}>
              <HostView hosts={hosts} links={links} applications={applications} />
            </TabPanel>
            <TabPanel value={value} index={1}>
              <ApplicationView applications={applications} hosts={hosts} links={links} />
            </TabPanel>
            <TabPanel value={value} index={2}>
              <ServiceView services={services} />
            </TabPanel>
            <TabPanel value={value} index={3}>
              <ProcessView processes={processes} />
            </TabPanel>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App; 