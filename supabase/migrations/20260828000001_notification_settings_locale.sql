alter table notification_settings
  add column if not exists locale text not null default 'it';
