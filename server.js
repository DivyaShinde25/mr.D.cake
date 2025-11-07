const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(__dirname));

// Route for main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(` Mr D Cakes website running at http://localhost:${PORT}`);
    console.log(`Admin Panel: http://localhost:${PORT}/admin.html`);
    console.log(`Favorites: http://localhost:${PORT}/favorites.html`);
    console.log('Press Ctrl+C to stop the server');
});