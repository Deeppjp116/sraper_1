const express = require('express');
const { getJson } = require('serpapi');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());

const API_KEY =
  '29ef478ea3c6c8be8e6d911ef46813cb81d6a25a17a712915048d32953f83282'; // Replace with your actual API key
const RESULTS_PER_PAGE = 5; // Adjust if needed

let currentDomain = '.ac.in'; // Default domain
let start = 0;
let allResults = [];
let isRunning = false;

// Domain options and their corresponding countries
const domainOptions = {
  '.ac.in': 'India',
  '.edu': 'USA',
  '.ac.uk': 'United Kingdom',
  '.ac.nz': 'New Zealand',
  '.ac.jp': 'Japan',
  '.ac.za': 'South Africa',
  '.ac.ir': 'Iran',
  '.ac.id': 'Indonesia',
  '.ac.kr': 'South Korea',
  '.ac.th': 'Thailand',
  '.ac.cn': 'China',
};

// Function to fetch search results from SerpAPI
const fetchResults = () => {
  if (!isRunning) return;

  getJson(
    {
      engine: 'google',
      q: `site:${currentDomain}`,
      api_key: API_KEY,
      num: RESULTS_PER_PAGE,
      start: start,
    },
    async (json) => {
      if (json.organic_results && json.organic_results.length > 0) {
        for (let result of json.organic_results) {
          if (result.link && result.title) {
            const emails = await scrapeEmails(result.link); // Fetch emails from the site
            const siteData = {
              title: result.title,
              link: result.link,
              emails: emails,
              hasEmails: emails.length > 0,
              domain: currentDomain,
              country: domainOptions[currentDomain],
            };
            allResults.push(siteData);
          }
        }

        start += RESULTS_PER_PAGE;
        if (isRunning) {
          setTimeout(fetchResults, 2000); // Fetch next page after 2 sec
        }
      } else {
        console.log('No more results available.');
        isRunning = false;
      }
    }
  );
};

// Function to scrape emails from a given website
const scrapeEmails = async (url) => {
  try {
    console.log(`Scraping ${url}`);
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    }); // Fetch site content
    const $ = cheerio.load(response.data);
    const htmlContent = $.text(); // Extract text from HTML

    // Regular expression to match emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = htmlContent.match(emailRegex) || [];

    // Filter out duplicates
    const uniqueEmails = [...new Set(emails)];

    console.log(`Emails found on ${url}:`, uniqueEmails);
    return uniqueEmails;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
    return [];
  }
};

// Calculate statistics about universities with emails
const calculateStats = () => {
  const totalUniversities = allResults.length;
  const universitiesWithEmails = allResults.filter(
    (result) => result.hasEmails
  ).length;
  const percentage =
    totalUniversities > 0
      ? ((universitiesWithEmails / totalUniversities) * 100).toFixed(2)
      : 0;

  // Stats by domain
  const domainStats = {};
  Object.keys(domainOptions).forEach((domain) => {
    const domainResults = allResults.filter(
      (result) => result.domain === domain
    );
    const domainTotal = domainResults.length;
    const withEmails = domainResults.filter(
      (result) => result.hasEmails
    ).length;
    const domainPercentage =
      domainTotal > 0 ? ((withEmails / domainTotal) * 100).toFixed(2) : 0;

    domainStats[domain] = {
      country: domainOptions[domain],
      total: domainTotal,
      withEmails: withEmails,
      percentage: domainPercentage,
    };
  });

  return {
    total: totalUniversities,
    withEmails: universitiesWithEmails,
    percentage: percentage,
    byDomain: domainStats,
  };
};

// API endpoint to get domain options
app.get('/domains', (req, res) => {
  res.json(domainOptions);
});

// API endpoint to set current domain and start scraping
app.get('/start', (req, res) => {
  const domain = req.query.domain;
  if (domain && domainOptions[domain]) {
    currentDomain = domain;
    // Reset counters for new domain
    start = 0;
    isRunning = true;
    // Don't clear previous results, just start fetching for new domain
    fetchResults();
    res.json({
      success: true,
      message: `Started scraping for ${domainOptions[domain]} (${domain})`,
    });
  } else {
    res.status(400).json({ success: false, message: 'Invalid domain' });
  }
});

// API endpoint to stop scraping
app.get('/stop', (req, res) => {
  isRunning = false;
  res.json({ success: true, message: 'Scraping stopped' });
});

// API endpoint to clear all results
app.get('/clear', (req, res) => {
  allResults = [];
  res.json({ success: true, message: 'All results cleared' });
});

// API endpoint to get scraped results
app.get('/results', (req, res) => {
  const domain = req.query.domain;
  if (domain) {
    // Filter results by domain
    res.json(allResults.filter((result) => result.domain === domain));
  } else {
    // Return all results
    res.json(allResults);
  }
});

// API endpoint to get statistics
app.get('/stats', (req, res) => {
  res.json(calculateStats());
});

// Start the server
app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
