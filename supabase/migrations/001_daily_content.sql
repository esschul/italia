create table daily_content (
  id          bigint generated always as identity primary key,
  display_date date not null unique,
  type        text not null check (type in ('countdown', 'itinerary')),
  title       text not null,
  fun_fact    text not null,
  location    text,
  description text,
  created_at  timestamptz default now()
);

-- Allow public read access (the widget has no auth)
alter table daily_content enable row level security;

create policy "Public read"
  on daily_content for select
  using (true);
