const { registerOnReady } = require('./onReady');
const { registerOnMessageCreate } = require('./onMessageCreate');
const { registerOnInteractionCreate } = require('./onInteractionCreate');
const { registerInviteTracking } = require('./inviteTracking');

function registerEvents(client, store, ai, reviverService) {
  registerOnReady(client, store, reviverService);
  registerOnMessageCreate(client, store, ai);
  registerOnInteractionCreate(client, store, ai);
  registerInviteTracking(client, store);
}

module.exports = { registerEvents };
