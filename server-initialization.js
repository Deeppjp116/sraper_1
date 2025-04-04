const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());

// Import route handlers
const routes = require('./routes');

// Register routes
app.use('/', routes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
