-- ====================================================================
-- SUPABASE DATABASE SCHEMA FOR HOUSING PRICE PREDICTOR
-- Run this script in your Supabase SQL Editor (https://app.supabase.com)
-- ====================================================================

-- 1. Create Predictions Table
create table if not exists predictions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  formatted_price text not null,
  predicted_price numeric not null,
  confidence text not null,
  med_inc numeric,
  house_age numeric,
  ave_rooms numeric,
  ave_bedrms numeric,
  population numeric,
  ave_occup numeric,
  latitude numeric,
  longitude numeric
);

-- 2. Enable Row Level Security (RLS)
alter table predictions enable row level security;

-- 3. Create Public Access Policies
create policy "Allow anonymous insert" 
  on predictions for insert 
  with check (true);

create policy "Allow anonymous select" 
  on predictions for select 
  using (true);

-- 4. Enable Realtime Subscriptions (Optional)
alter publication supabase_realtime add table predictions;
