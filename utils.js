const state = require('./state');
const config = require('./config');

// Calculate statistics about universities with emails
const calculateStats = () => {
  const totalUniversities = state.allResults.length;
  const universitiesWithEmails = state.allResults.filter(
    (result) => result.hasEmails
  ).length;
  const percentage =
    totalUniversities > 0
      ? ((universitiesWithEmails / totalUniversities) * 100).toFixed(2)
      : 0;

  // Stats by domain
  const domainStats = {};
  Object.keys(config.DOMAIN_OPTIONS).forEach((domain) => {
    const domainResults = state.allResults.filter(
      (result) => result.domain === domain
    );
    const domainTotal = domainResults.length;
    const withEmails = domainResults.filter(
      (result) => result.hasEmails
    ).length;
    const domainPercentage =
      domainTotal > 0 ? ((withEmails / domainTotal) * 100).toFixed(2) : 0;

    domainStats[domain] = {
      country: config.DOMAIN_OPTIONS[domain],
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

module.exports = {
  calculateStats
};
