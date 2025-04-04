const express = require('express');
const router = express.Router();
const config = require('./config');
const state = require('./state');
const scraper = require('./scraper');
const utils = require('./utils');

// API endpoint to get domain options
router.get('/domains', (req, res) => {
  res.json(config.DOMAIN_OPTIONS);
});

// API endpoint to set current domain and start scraping
router.get('/start', (req, res) => {
  const domain = req.query.domain;
  if (domain && config.DOMAIN_OPTIONS[domain]) {
    state.currentDomain = domain;
    // Reset counters for new domain
    state.start = 0;
    state.isRunning = true;
    // Don't clear previous results, just start fetching for new domain
    scraper.fetchResults();
    res.json({
      success: true,
      message: `Started scraping for ${config.DOMAIN_OPTIONS[domain]} (${domain})`,
    });
  } else {
    res.status(400).json({ success: false, message: 'Invalid domain' });
  }
});

// API endpoint to stop scraping
router.get('/stop', (req, res) => {
  state.isRunning = false;
  res.json({ success: true, message: 'Scraping stopped' });
});

// API endpoint to clear all results
router.get('/clear', (req, res) => {
  state.allResults = [];
  res.json({ success: true, message: 'All results cleared' });
});

// API endpoint to get scraped results
router.get('/results', (req, res) => {
  const domain = req.query.domain;
  if (domain) {
    // Filter results by domain
    res.json(state.allResults.filter((result) => result.domain === domain));
  } else {
    // Return all results
    res.json(state.allResults);
  }
});

// API endpoint to get statistics
router.get('/stats', (req, res) => {
  res.json(utils.calculateStats());
});

module.exports = router;
