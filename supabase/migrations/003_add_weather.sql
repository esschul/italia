alter table daily_content
  add column weather_temp_max   integer,
  add column weather_temp_min   integer,
  add column weather_condition  text,
  add column weather_precip_pct integer;
