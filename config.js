// Configuration for different environments
const CONFIG = {
    // Change this to your production server URL when deploying
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3001' 
        : window.location.origin, // Uses same domain as frontend
    
    // Alternative: Use relative URLs if frontend and backend are on same server
    // API_BASE_URL: '',
};

// Make config globally available
window.CONFIG = CONFIG;