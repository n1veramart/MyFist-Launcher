# DravenX Codex

Production-ready modular Discord bot (Node.js + discord.js) focused on security, progression, engagement, practical utility, and admin-safe operations.

## Highlights
- Prefix + slash parity for all commands.
- Slash responses are ephemeral by default.
- Prefix command message is deleted and bot output auto-deletes in 7 seconds (except persistent engagement posts like trivia/reviver starters).
- XP-only progression system.
- AI usage focused on randomization (topic/trivia generation).
- Optional Supabase persistence with in-memory fallback.
- Centralized `dravenlogs` channel for command/activity logs.

## Commands
### Security
`help`, `check`, `securitystats`, `securityfeed`, `report`, `guard`, `dravenlogs`

### Progression
`daily`, `quests`, `profile`, `rankcard`, `leaderboard`, `setlevelrole`, `levelroles`, `xprewards`, `unlockrole`, `setxprate`

### Utility
`prefix`, `config`, `backupconfig`, `restoreconfig`, `ping`, `changelog`

### Engagement
`topic`, `trivia`, `settriviareward`, `triviastats`, `triviahistory`, `setupreviver`, `reviverstatus`, `reviverpause`

### Productivity
`learn`, `learnbulk`, `faq`, `faqdelete`

## Notes
- `setupreviver` enforces a minimum inactivity threshold of **240 minutes**.
- `trivia` can run once per channel every **4 hours**, picks randomized questions, and rewards XP.
- `config` provides single admin snapshot of key guild settings.
- `backupconfig`/`restoreconfig` provide admin configuration portability.

## Setup
1. Copy `.env.example` to `.env` and fill values.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start:
   ```bash
   npm start
   ```

## Deployment
- Docker: `Dockerfile` + `docker-compose.yml`
- systemd: `ops/systemd/dravenx-codex.service`
- Supabase schema: `supabase/schema.sql`
