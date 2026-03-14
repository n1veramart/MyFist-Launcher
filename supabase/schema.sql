create table if not exists guild_settings (
  guild_id bigint primary key,
  prefix text default '=',
  guard_enabled boolean default false,
  trivia_xp_reward integer default 25,
  draven_logs_channel_id bigint,
  message_xp integer default 2,
  daily_xp integer default 50,
  quest_xp integer default 20
);

create table if not exists user_levels (
  guild_id bigint not null,
  user_id bigint not null,
  xp integer default 0,
  quests integer default 0,
  daily_at timestamptz,
  primary key (guild_id, user_id)
);

create table if not exists trust_scores (
  user_id bigint primary key,
  trust_score integer default 100,
  reports integer default 0
);

create table if not exists scam_reports (
  id bigint generated always as identity primary key,
  guild_id bigint not null,
  reporter_id bigint not null,
  target_id bigint,
  payload text,
  created_at timestamptz default now()
);

create table if not exists security_events (
  id bigint generated always as identity primary key,
  guild_id bigint not null,
  event_type text not null,
  payload text,
  target_id bigint,
  created_at timestamptz default now()
);

create table if not exists reviver_config (
  guild_id bigint primary key,
  channel_id bigint not null,
  inactivity_minutes integer not null default 240,
  role_id bigint,
  paused boolean default false
);

create table if not exists faq_entries (
  id bigint generated always as identity primary key,
  guild_id bigint not null,
  question text not null,
  answer text not null,
  created_at timestamptz default now()
);

create table if not exists level_roles (
  guild_id bigint not null,
  required_xp integer not null,
  role_id bigint not null,
  primary key (guild_id, role_id)
);
