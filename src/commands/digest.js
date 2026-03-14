const { AttachmentBuilder } = require('discord.js');
const { makeEmbed } = require('../utils/embed');
const { replyPrefix, replySlash } = require('../utils/respond');

function quickChartUrl(labels, values, guildName) {
  const chartConfig = {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Messages',
        data: values,
        backgroundColor: '#FF8C00',
        borderColor: '#FF8C00',
        borderWidth: 1,
        borderRadius: 8,
      }],
    },
    options: {
      plugins: {
        legend: { labels: { color: '#f5f5f5' } },
        title: {
          display: true,
          text: `${guildName} • 7 Day Activity Digest`,
          color: '#f5f5f5',
          font: { size: 18, weight: 'bold' },
        },
      },
      scales: {
        x: { ticks: { color: '#f5f5f5' }, grid: { color: '#2b2b2b' } },
        y: { beginAtZero: true, ticks: { color: '#f5f5f5' }, grid: { color: '#2b2b2b' } },
      },
      layout: { padding: 16 },
    },
  };

  const encoded = encodeURIComponent(JSON.stringify(chartConfig));
  return `https://quickchart.io/chart?width=1100&height=620&format=png&backgroundColor=%23151515&c=${encoded}`;
}

async function buildDigestPayload(guildName, labels, values, activeMembers) {
  const total = values.reduce((a, b) => a + b, 0);
  const peak = Math.max(...values, 0);
  const peakIdx = values.indexOf(peak);
  const peakDay = peakIdx >= 0 ? labels[peakIdx] : 'N/A';
  const chartUrl = quickChartUrl(labels, values, guildName);

  const embed = makeEmbed(
    '<:draven_chart:1477349258054340813> Weekly Digest',
    'Weekly Digest',
    [
      ['Total Messages (7d)', String(total)],
      ['Peak Day', `${peakDay} (${peak})`],
      ['Active Members (7d)', String(activeMembers)],
    ]
  );

  try {
    const res = await fetch(chartUrl);
    if (!res.ok) throw new Error(`QuickChart ${res.status}`);
    const arr = await res.arrayBuffer();
    const file = new AttachmentBuilder(Buffer.from(arr), { name: 'weekly-digest.png' });
    embed.setImage('attachment://weekly-digest.png');
    return { embed, files: [file] };
  } catch {
    embed.setImage(chartUrl);
    return { embed, files: [] };
  }
}

module.exports = {
  name: 'digest',
  async prefix({ message, store }) {
    const { labels, values } = store.getLast7DayMessageSeries(message.guild.id);
    const payload = await buildDigestPayload(message.guild.name, labels, values, store.getActiveMembersCount(message.guild.id, 7));
    await replyPrefix(message, payload.embed, [], { files: payload.files, autoDelete: false });
  },
  async slash({ interaction, store }) {
    const { labels, values } = store.getLast7DayMessageSeries(interaction.guildId);
    const payload = await buildDigestPayload(interaction.guild.name, labels, values, store.getActiveMembersCount(interaction.guildId, 7));
    await replySlash(interaction, payload.embed, [], { files: payload.files, ephemeral: false, autoDelete: false });
  },
};
