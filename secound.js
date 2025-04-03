const express = require('express');
const { getJson } = require('serpapi');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static('public')); // Serve static files from "public" folder

const API_KEY =
  '29ef478ea3c6c8be8e6d911ef46813cb81d6a25a17a712915048d32953f83282'; // Replace with your API key
const QUERY = 'site:.ac.in'; // Search query
const RESULTS_PER_PAGE = 10;
let start = 0;
let allResults = [];

// Fetch results with pagination
const fetchResults = () => {
  getJson(
    {
      engine: 'google',
      q: QUERY,
      api_key: API_KEY,
      num: RESULTS_PER_PAGE,
      start: start,
    },
    (json) => {
      if (json.organic_results && json.organic_results.length > 0) {
        json.organic_results.forEach((result) => {
          if (result.link && result.title) {
            allResults.push({
              title: result.title,
              link: result.link,
            });
          }
        });

        start += RESULTS_PER_PAGE;
        setTimeout(fetchResults, 2000); // Fetch next page after 2 sec
      } else {
        console.log('No more results available.');
      }
    }
  );
};

// Start fetching results
fetchResults();

// API endpoint for results
app.get('/results', (req, res) => {
  res.json(allResults);
});

// Start server
app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
