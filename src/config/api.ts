export const API_CONFIG = {
  baseUrl: '/api',
  token: process.env.REACT_APP_DYNATRACE_API_TOKEN,
  headers: {
    'Authorization': `Api-Token ${process.env.REACT_APP_DYNATRACE_API_TOKEN}`,
    'Content-Type': 'application/json'
  },
  defaultParams: {
    pageSize: 400
  }
}; 