function verdict(score) {
  if (score >= 75) return 'Low Risk';
  if (score >= 45) return 'Caution';
  return 'High Risk';
}

module.exports = { verdict };
