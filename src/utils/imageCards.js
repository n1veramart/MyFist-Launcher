function escapeXml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildWelcomeCardSvg(username, guildName, joinPosition, avatarUrl) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="460" viewBox="0 0 1200 460">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#0f1117" />
      <stop offset="100%" stop-color="#1b2230" />
    </linearGradient>
    <clipPath id="avatarClip"><circle cx="180" cy="230" r="110"/></clipPath>
  </defs>
  <rect width="1200" height="460" rx="28" fill="url(#bg)"/>
  <rect x="30" y="30" width="1140" height="400" rx="22" fill="#0b0d12" opacity="0.45"/>
  <text x="340" y="110" fill="#FF8C00" font-size="54" font-family="Arial" font-weight="700">👻 Ghostly ID</text>
  <text x="340" y="164" fill="#f2f4f8" font-size="38" font-family="Arial">${escapeXml(username)}</text>
  <text x="340" y="214" fill="#bfc7d5" font-size="28" font-family="Arial">Joined: ${escapeXml(guildName)}</text>
  <text x="340" y="264" fill="#bfc7d5" font-size="28" font-family="Arial">Member Position: #${joinPosition}</text>
  <rect x="340" y="300" width="760" height="86" rx="16" fill="#1d2535"/>
  <text x="370" y="353" fill="#ffffff" font-size="26" font-family="Arial">Welcome aboard. Keep the community safe and respectful.</text>
  <circle cx="180" cy="230" r="116" fill="#FF8C00" opacity="0.35"/>
  <image href="${avatarUrl}" x="70" y="120" width="220" height="220" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice"/>
</svg>`;
}

module.exports = { buildWelcomeCardSvg };
