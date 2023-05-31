const yahooFinance = require('yahoo-finance');
const express = require('express');
const axios = require('axios');
const http = require('http');
const app = express();
const port = 3000;
const path = require('path');

app.use(express.static('frontend'));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/stock-data', async (req, res) => {
    try {
      // Make the API request to Yahoo Finance API
      const response = await axios.get(`https://query1.finance.yahoo.com/v7/finance/chart/${req.query.symbol}?range=12mo&interval=1d`);
  
      // Forward the API response to the client
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error occurred');
    }
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});
