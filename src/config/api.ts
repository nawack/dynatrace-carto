export const API_CONFIG = {
  baseUrl: process.env.REACT_APP_DYNATRACE_URL || 'https://your-dynatrace-instance.com',
  token: process.env.REACT_APP_DYNATRACE_TOKEN,
  headers: {
    'Authorization': `Api-Token ${process.env.REACT_APP_DYNATRACE_TOKEN}`,
    'Content-Type': 'application/json'
  }
}; 