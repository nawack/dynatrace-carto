export const API_CONFIG = {
  baseUrl: process.env.REACT_APP_DYNATRACE_URL,
  token: process.env.REACT_APP_DYNATRACE_API_TOKEN,
  headers: {
    'Authorization': `Api-Token ${process.env.REACT_APP_DYNATRACE_API_TOKEN}`,
    'Content-Type': 'application/json'
  }
}; 