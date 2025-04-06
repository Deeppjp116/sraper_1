// Configuration constants
const config = {
  API_KEY: '9e9aa09249ba27bea1fd14de20603ddc60a7b274622531cf599ab9c43a539b3c', // Replace with your actual API key
  RESULTS_PER_PAGE: 5, // Adjust if needed

  // Inner page scraping settings
  SCRAPE_INNER_PAGES: true, // Enable/disable inner page scraping
  MAX_DEPTH: 1, // How deep to go (0 = just the main page, 1 = main page + linked pages)
  MAX_INNER_PAGES: 5, // Maximum number of inner pages to scrape per main page
  STOP_ON_FIRST_EMAIL: true, // Stop scraping after finding the first email

  // Domain options and their corresponding countries
  DOMAIN_OPTIONS: {
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
  },
};

module.exports = config;
