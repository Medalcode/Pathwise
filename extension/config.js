// Configuration for AutoApply Extension
// This file contains the API URL configuration

const CONFIG = {
  // Environment: 'development' or 'production'
  ENVIRONMENT: 'production', // Cambiar a 'production' cuando despliegues
  
  // API URLs
  API_URLS: {
    development: 'http://localhost:3000/api',
    production: 'https://panoptes-72529155548.us-central1.run.app/api'
  },
  
  // Get current API URL based on environment
  getApiUrl() {
    return this.API_URLS[this.ENVIRONMENT];
  },
  
  // Dashboard URLs
  DASHBOARD_URLS: {
    development: 'http://localhost:3000',
    production: 'https://panoptes-72529155548.us-central1.run.app'
  },
  
  // Get current dashboard URL
  getDashboardUrl() {
    return this.DASHBOARD_URLS[this.ENVIRONMENT];
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
