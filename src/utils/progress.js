function progressBar(xp) {
  const level = Math.floor(xp / 100);
  const inLevel = xp % 100;
  const filled = Math.floor(inLevel / 10);
  return `Level ${level} [${'█'.repeat(filled)}${'░'.repeat(10 - filled)}] ${inLevel}/100`;
}

module.exports = { progressBar };
