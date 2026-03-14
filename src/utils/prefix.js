const { DEFAULT_PREFIX, MAX_PREFIX_LENGTH } = require('../config/constants');

function normalizePrefix(prefix) {
  const p = (prefix || DEFAULT_PREFIX).trim();
  return (p.slice(0, MAX_PREFIX_LENGTH) || DEFAULT_PREFIX);
}

module.exports = { normalizePrefix };
