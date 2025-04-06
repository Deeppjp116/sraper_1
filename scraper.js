const { getJson } = require('serpapi');
const axios = require('axios');
const cheerio = require('cheerio');
const config = require('./config');
const state = require('./state');

// Function to fetch search results from SerpAPI
const fetchResults = () => {
  if (!state.isRunning) return;

  getJson(
    {
      engine: 'google',
      q: `site:${state.currentDomain}`,
      api_key: config.API_KEY,
      num: config.RESULTS_PER_PAGE,
      start: state.start,
    },
    async (json) => {
      if (json.organic_results && json.organic_results.length > 0) {
        for (let result of json.organic_results) {
          if (result.link && result.title && state.isRunning) {
            // Use empty Set for tracking visited URLs
            const visitedUrls = new Set();

            // Determine whether to scrape inner pages based on config
            const maxDepth = config.SCRAPE_INNER_PAGES ? config.MAX_DEPTH : 0;

            // Fetch emails from the site and its inner pages if enabled
            const emails = await scrapeEmails(
              result.link,
              0, // Start at depth 0 (main page)
              maxDepth,
              visitedUrls
            );

            const siteData = {
              title: result.title,
              link: result.link,
              emails: emails,
              hasEmails: emails.length > 0,
              domain: state.currentDomain,
              country: config.DOMAIN_OPTIONS[state.currentDomain],
              pagesScraped: visitedUrls.size,
            };
            state.allResults.push(siteData);
          }
        }

        state.start += config.RESULTS_PER_PAGE;
        if (state.isRunning) {
          setTimeout(fetchResults, 2000); // Fetch next page after 2 sec
        }
      } else {
        console.log('No more results available.');
        state.isRunning = false;
      }
    }
  );
};

// Function to extract internal links from a webpage
const extractInternalLinks = ($, baseUrl) => {
  try {
    const baseUrlObj = new URL(baseUrl);
    const links = new Set();

    // Find all anchor tags and extract href attributes
    $('a').each((_, element) => {
      const href = $(element).attr('href');
      if (!href) return;

      try {
        // Skip mailto, javascript, and anchor links
        if (
          href.startsWith('mailto:') ||
          href.startsWith('javascript:') ||
          href.startsWith('#') ||
          href.startsWith('tel:')
        ) {
          return;
        }

        // Handle relative and absolute URLs
        let fullUrl;

        if (href.startsWith('http')) {
          // Absolute URL
          fullUrl = new URL(href);

          // Only include links from the same domain
          if (fullUrl.hostname !== baseUrlObj.hostname) {
            return;
          }
        } else if (href.startsWith('/')) {
          // Root-relative URL
          fullUrl = new URL(href, baseUrlObj.origin);
        } else {
          // Relative URL
          fullUrl = new URL(href, baseUrl);
        }

        // Add to our set of links (Set automatically handles duplicates)
        links.add(fullUrl.href);
      } catch (error) {
        // Invalid URL, skip it
      }
    });

    return Array.from(links);
  } catch (error) {
    console.error(`Error extracting links from ${baseUrl}:`, error.message);
    return [];
  }
};

// Function to scrape emails from a given website and its inner pages
const scrapeEmails = async (
  url,
  depth = 0,
  maxDepth = 1,
  visitedUrls = new Set()
) => {
  if (depth > maxDepth || visitedUrls.has(url) || !state.isRunning) {
    return [];
  }

  visitedUrls.add(url);
  let allEmails = [];

  try {
    console.log(`Scraping ${url} (depth: ${depth})`);
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const $ = cheerio.load(response.data);
    const htmlContent = $.text(); // Extract text from HTML

    // Regular expression to match emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = htmlContent.match(emailRegex) || [];

    // Also check for mailto links
    $('a[href^="mailto:"]').each((_, element) => {
      const mailtoHref = $(element).attr('href');
      if (mailtoHref) {
        const email = mailtoHref.replace('mailto:', '').split('?')[0].trim();
        if (email && email.match(emailRegex)) {
          emails.push(email);
        }
      }
    });

    // Add emails from current page
    allEmails = [...emails];

    // If we found emails and we're configured to stop on first email, return early
    if (config.STOP_ON_FIRST_EMAIL && allEmails.length > 0) {
      console.log(
        `Found ${allEmails.length} emails on ${url}, stopping as configured.`
      );
      return [...new Set(allEmails)]; // Return unique emails
    }

    // If we haven't reached max depth, get internal links and scrape them
    if (depth < maxDepth) {
      // Get internal links
      const internalLinks = extractInternalLinks($, url);

      // Limit the number of internal pages to scrape to avoid excessive requests
      const pagesToScrape = internalLinks.slice(0, config.MAX_INNER_PAGES || 5);

      // Scrape each internal page
      for (const innerUrl of pagesToScrape) {
        if (!state.isRunning) break; // Stop if scraping was paused/stopped

        // If we found emails and we're configured to stop on first email, break the loop
        if (config.STOP_ON_FIRST_EMAIL && allEmails.length > 0) {
          break;
        }

        // Add a small delay between requests to be respectful
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const innerEmails = await scrapeEmails(
          innerUrl,
          depth + 1,
          maxDepth,
          visitedUrls
        );

        allEmails = [...allEmails, ...innerEmails];

        // If we found emails after checking an inner page and we're configured to stop, break the loop
        if (config.STOP_ON_FIRST_EMAIL && allEmails.length > 0) {
          break;
        }
      }
    }

    // Filter out duplicates
    const uniqueEmails = [...new Set(allEmails)];

    console.log(`Emails found on ${url} and inner pages:`, uniqueEmails);
    return uniqueEmails;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
    return [];
  }
};

module.exports = {
  fetchResults,
  scrapeEmails,
  extractInternalLinks,
};
