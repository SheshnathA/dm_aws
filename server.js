const cds = require('@sap/cds');
const express = require('express');

cds.on('bootstrap', (app) => {
  const allowedDomains = ['http://3.7.71.20/']; // Add your allowed domains

  // CORS middleware to handle cross-origin requests
  app.use((req, res, next) => {
    const origin = req.get('Origin') || '';

    // If the origin is in the allowed list, set the CORS headers
    if (allowedDomains.includes(origin)) {
      res.set('Access-Control-Allow-Origin', origin);
      res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.set('Access-Control-Allow-Credentials', 'true'); // Allow credentials like cookies
    }

    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204); // Send 204 No Content for OPTIONS requests
    }

    // Move to the next middleware or handler
    next();
  });

  // If you need to add more routes, add them here
});

module.exports = cds.server;  // Export the CAP server for PM2 to start
