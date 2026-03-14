function parsePrefixCommand(content, prefix) {
  const raw = content.slice(prefix.length).trim();
  const [nameRaw, ...args] = raw.split(/\s+/);
  return { name: (nameRaw || '').toLowerCase(), args, argText: args.join(' ').trim() };
}

module.exports = { parsePrefixCommand };
