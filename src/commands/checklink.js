const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');

function isIpHost(host) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host || '');
}

function buildHeuristics(urlObj) {
  const host = urlObj.hostname.toLowerCase();
  const text = `${urlObj.hostname}${urlObj.pathname}${urlObj.search}`.toLowerCase();
  const riskyTerms = ['nitro', 'gift', 'airdrop', 'wallet', 'verify', 'login', 'free', 'claim'];
  const matched = riskyTerms.filter((x) => text.includes(x));
  const flags = [];
  if (urlObj.protocol !== 'https:') flags.push('Non-HTTPS protocol');
  if (isIpHost(host)) flags.push('IP-based URL');
  if (host.includes('xn--')) flags.push('Punycode domain');
  if (host.split('.').length > 4) flags.push('Deep subdomain chain');
  if (matched.length) flags.push(`Suspicious terms: ${matched.join(', ')}`);
  const score = Math.max(0, 100 - (flags.length * 15));
  return { score, flags, matched };
}

async function domainAgeDays(hostname) {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(`https://rdap.org/domain/${hostname}`, { signal: ctrl.signal });
    if (!res.ok) return null;
    const json = await res.json();
    const regEvent = (json.events || []).find((e) => /registration/i.test(e.eventAction || ''));
    if (!regEvent?.eventDate) return null;
    return Math.max(1, Math.floor((Date.now() - new Date(regEvent.eventDate).getTime()) / 86400000));
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function run(url, ai) {
  let parsed;
  try { parsed = new URL(url); } catch { return { error: 'Invalid URL.' }; }

  const heur = buildHeuristics(parsed);
  const age = await domainAgeDays(parsed.hostname);
  const aiReview = await ai.securityReview(url, { ...heur, domainAgeDays: age });
  const score = aiReview?.score ?? heur.score;
  const verdict = aiReview?.verdict || (score >= 75 ? 'Low Risk' : (score >= 45 ? 'Caution' : 'High Risk'));
  const flags = [...heur.flags, ...(aiReview?.flags || [])].slice(0, 8);
  return { host: parsed.hostname, score, verdict, flags, age };
}

function build(result, url) {
  if (result.error) return makeEmbed('🛡️ Link Check', result.error);
  return makeEmbed('🛡️ Link Check', 'Security assessment complete.', [
    ['🔗 URL', url],
    ['📊 Safety Score', `${result.score}/100`],
    ['⚖️ Verdict', result.verdict],
    ['🕒 Domain Age', result.age ? `${result.age} days` : 'Unavailable'],
    ['🚩 Risk Flags', result.flags.length ? result.flags.join('\n') : 'No major flags detected'],
  ]);
}

module.exports = {
  name: 'checklink',
  async prefix({ message, ai, args, store }) {
    const url = args[0];
    if (!url) return replyPrefix(message, makeEmbed('🛡️ Link Check', 'Use: checklink <url>'));
    const result = await run(url, ai);
    await store.addSecurityEvent(message.guild.id, 'LINK CHECK', url);
    await replyPrefix(message, build(result, url));
  },
  async slash({ interaction, ai, store }) {
    const url = interaction.options.getString('url', true);
    const result = await run(url, ai);
    await store.addSecurityEvent(interaction.guildId, 'LINK CHECK', url);
    await replySlash(interaction, build(result, url));
  },
};
