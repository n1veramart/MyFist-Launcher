const { DELETE_AFTER_MS } = require('../config/constants');

function scheduleDelete(message) {
  setTimeout(() => message.delete().catch(() => null), DELETE_AFTER_MS);
}

async function replyPrefix(message, embed, components = [], options = {}) {
  const { autoDelete = true, files = [] } = options;
  await message.delete().catch(() => null);
  const sent = await message.channel.send({ embeds: [embed], components, files });
  if (autoDelete) scheduleDelete(sent);
  return sent;
}

async function replySlash(interaction, embed, components = [], options = {}) {
  const { ephemeral = true, autoDelete = true, files = [] } = options;
  const payload = { embeds: [embed], components, ephemeral, fetchReply: true, files };

  let msg;
  if (interaction.deferred && !interaction.replied) {
    msg = await interaction.editReply(payload);
  } else if (interaction.replied) {
    msg = await interaction.followUp(payload);
  } else {
    msg = await interaction.reply(payload);
  }

  if (autoDelete && msg?.delete) scheduleDelete(msg);
  return msg;
}

module.exports = { replyPrefix, replySlash };
