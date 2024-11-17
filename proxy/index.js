// app.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

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

// Example route for the root
app.get('/', (req, res) => {
    res.send('Hello, World!');
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
                res.json({stopped: true});
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
