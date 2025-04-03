const express = require('express');
const { getJson } = require('serpapi');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());

const API_KEY =
  '29ef478ea3c6c8be8e6d911ef46813cb81d6a25a17a712915048d32953f83282'; // Replace with your actual API key
const QUERY = 'site:.ac.in'; // Query for educational sites
const RESULTS_PER_PAGE = 5; // Adjust if needed
let start = 0;
let allResults = [];

// Function to fetch search results from SerpAPI
const fetchResults = () => {
  getJson(
    {
      engine: 'google',
      q: QUERY,
      api_key: API_KEY,
      num: RESULTS_PER_PAGE,
      start: start,
    },
    async (json) => {
      if (json.organic_results && json.organic_results.length > 0) {
        for (let result of json.organic_results) {
          if (result.link && result.title) {
            const siteData = {
              title: result.title,
              link: result.link,
              emails: await scrapeEmails(result.link), // Fetch emails from the site
            };
            allResults.push(siteData);
          }
        }

        start += RESULTS_PER_PAGE;
        setTimeout(fetchResults, 2000); // Fetch next page after 2 sec
      } else {
        console.log('No more results available.');
      }
    }
  );
};

// Function to scrape emails from a given website
const scrapeEmails = async (url) => {
  try {
    const response = await axios.get(url, { timeout: 5000 }); // Fetch site content
    const $ = cheerio.load(response.data);
    const htmlContent = $.text(); // Extract text from HTML

    // Regular expression to match emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = htmlContent.match(emailRegex) || [];

    console.log(`Emails found on ${url}:`, emails);
    return emails;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
    return [];
  }
};

// Start fetching results
fetchResults();

// API endpoint to get scraped results
app.get('/results', (req, res) => {
  res.json(allResults);
});

// Start the server
app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
