
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  sender_name text,
  reply_to text,
  signature text,
  timezone text default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- SMTP settings (one per user)
create table public.smtp_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'gmail', -- gmail | outlook | custom
  host text not null,
  port int not null default 587,
  secure boolean not null default false,
  username text not null,
  password text not null, -- app password / smtp password
  from_email text not null,
  from_name text,
  updated_at timestamptz not null default now()
);
alter table public.smtp_settings enable row level security;
create policy "own smtp all" on public.smtp_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Recipient lists
create table public.recipient_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);
alter table public.recipient_lists enable row level security;
create policy "own lists all" on public.recipient_lists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.recipients (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.recipient_lists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  name text,
  company text,
  custom_fields jsonb default '{}'::jsonb,
  is_valid boolean default true,
  created_at timestamptz not null default now()
);
create index recipients_list_idx on public.recipients(list_id);
create unique index recipients_list_email_uniq on public.recipients(list_id, lower(email));
alter table public.recipients enable row level security;
create policy "own recipients all" on public.recipients for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Templates
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  subject text,
  html text,
  created_at timestamptz not null default now()
);
alter table public.templates enable row level security;
create policy "own templates all" on public.templates for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Campaigns
create type campaign_status as enum ('draft','scheduled','sending','sent','paused','failed');

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  subject text not null,
  html text not null,
  list_id uuid references public.recipient_lists(id) on delete set null,
  status campaign_status not null default 'draft',
  scheduled_at timestamptz,
  timezone text default 'UTC',
  batch_size int not null default 20,
  batch_delay_seconds int not null default 60,
  reply_to text,
  from_name text,
  total_recipients int not null default 0,
  sent_count int not null default 0,
  failed_count int not null default 0,
  open_count int not null default 0,
  click_count int not null default 0,
  last_batch_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index campaigns_user_idx on public.campaigns(user_id);
create index campaigns_status_idx on public.campaigns(status, scheduled_at);
alter table public.campaigns enable row level security;
create policy "own campaigns all" on public.campaigns for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Per-recipient campaign rows
create type campaign_recipient_status as enum ('queued','sending','sent','failed');

create table public.campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  name text,
  company text,
  status campaign_recipient_status not null default 'queued',
  tracking_id uuid not null default gen_random_uuid(),
  error_message text,
  sent_at timestamptz,
  opens int not null default 0,
  clicks int not null default 0,
  created_at timestamptz not null default now()
);
create index cr_campaign_idx on public.campaign_recipients(campaign_id, status);
create unique index cr_tracking_uniq on public.campaign_recipients(tracking_id);
alter table public.campaign_recipients enable row level security;
create policy "own cr select" on public.campaign_recipients for select using (auth.uid() = user_id);
create policy "own cr modify" on public.campaign_recipients for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Events (open/click) - public insert allowed for tracking
create table public.email_events (
  id uuid primary key default gen_random_uuid(),
  campaign_recipient_id uuid not null references public.campaign_recipients(id) on delete cascade,
  user_id uuid not null,
  campaign_id uuid not null,
  event_type text not null check (event_type in ('open','click')),
  url text,
  user_agent text,
  ip text,
  created_at timestamptz not null default now()
);
create index events_campaign_idx on public.email_events(campaign_id, event_type);
alter table public.email_events enable row level security;
create policy "own events select" on public.email_events for select using (auth.uid() = user_id);
-- inserts happen via service role in tracking endpoints (no insert policy needed for users)
