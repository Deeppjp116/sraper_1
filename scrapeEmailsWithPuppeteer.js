// scrapeEmailsWithPuppeteer.js
const puppeteer = require('puppeteer');

async function scrapeEmailsFromPage(url) {
  const browser = await puppeteer.launch({
    headless: true, // set to false if you want to see the browser in action
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    await page.goto(url, { timeout: 30000, waitUntil: 'domcontentloaded' });

    const pageContent = await page.content();

    // Extract emails from the entire HTML using regex
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = pageContent.match(emailRegex) || [];

    await browser.close();
    return [...new Set(emails)]; // remove duplicates
  } catch (error) {
    console.error(`❌ Error scraping ${url}:`, error.message);
    await browser.close();
    return [];
  }
}

module.exports = scrapeEmailsFromPage;
