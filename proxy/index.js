// app.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;
const cors = require('cors'); // Import the cors package

app.use(cors({
    origin: 'https://washgrozad.onrender.com', // Allow requests from this domain
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Allow specific headers
}));

const machineIds = [process.env.deviceIdM1, process.env.deviceIdM2, process.env.deviceIdM3, process.env.deviceIdM4]

const verifyBearerToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];  // Extract the token from 'Bearer <token>'


    if (!token || token !== process.env.SMARTTHINGS_ACCESS_TOKEN) {
        return res.status(403).json({ error: 'Invalid or missing Bearer token' });
    }

    next();  // Token is valid, proceed to the route handler
};

// Middleware for parsing JSON request bodies
app.use(express.json());

// OAuth2 Configuration
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const AUTHORIZATION_URL = process.env.AUTHORIZATION_URL;
const TOKEN_URL = process.env.TOKEN_URL;

// Step 1: Redirect to OAuth2 provider for authorization
app.get('/oauth/authorize', (req, res) => {
  const authorizationUrl = `${AUTHORIZATION_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=r:devices`;
  res.redirect(authorizationUrl);
});

// Step 2: Handle the redirect from the OAuth2 provider
app.get('/oauth/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send('No authorization code received');
  }

  try {
    // Exchange the authorization code for an access token
    const response = await axios.post(TOKEN_URL, {
      code: code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
    });

    const accessToken = response.data.access_token;

    // Store the access token (e.g., in session or database) for later use
    // For now, just send it as a response
    res.send(`Access token: ${accessToken}`);
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    res.status(500).send('Error exchanging code for token');
  }
});

// Example API endpoint
app.post('/device/:nr', verifyBearerToken, async (req, res) => {
    const machineNr = parseInt(req.params.nr, 10);
    if (isNaN(machineNr) || machineNr < 1 || machineNr > machineIds.length) {
        return res.status(400).json({ error: 'Invalid machine number' });
    }

    // Get the corresponding deviceId from the machineIds array
    const deviceId = machineIds[machineNr - 1]; // Adjust index since machineNr is 1-based

    try {
        // Make an HTTP GET request to the SmartThings API
        const response = await axios.get(`https://api.smartthings.com/v1/devices/${deviceId}/status`, {
            headers: {
                'Authorization': `Bearer ${process.env.SMARTTHINGS_ACCESS_TOKEN}` // dotenv
            }
        });

        const operatingState = response.data.components.main.washerOperatingState;

        if(operatingState)
            if(operatingState.machineState.value === 'stop')
                res.json({stopped: true, completionTime: operatingState.completionTime});
            else {
                res.json({
                    stopped: false,
                    completionTime: operatingState.completionTime
                });
            }

        else
            res.status(503).send('Eroare API');

    } catch (error) {
        // Handle any errors during the HTTP request
        console.error(error);
        res.status(500).json({ error: 'Eroare de conexiune' });
    }
});







// 404 Error handler for undefined routes
app.use((req, res, next) => {
    res.status(404).send('Route not found');
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
