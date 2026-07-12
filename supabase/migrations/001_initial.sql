-- ============================================================
-- Node AI Life Manager — Initial Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── Helper: every table gets user_id + timestamps ─────────────────────────
-- RLS policy template applied per table below.

-- ── Tasks ────────────────────────────────────────────────────────────────
create table if not exists tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  status       text not null default 'todo',
  priority     text,
  due_date     timestamptz,
  project_id   uuid,
  parent_id    uuid,
  learning_goal_id uuid,
  tags         text[],
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table tasks enable row level security;
create policy "tasks_owner" on tasks using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Projects ─────────────────────────────────────────────────────────────
create table if not exists projects (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  description  text,
  color        text,
  status       text not null default 'active',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table projects enable row level security;
create policy "projects_owner" on projects using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Calendar Events ───────────────────────────────────────────────────────
create table if not exists events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  description  text,
  start_time   timestamptz not null,
  end_time     timestamptz,
  category     text,
  contact_id   uuid,
  recurrence   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table events enable row level security;
create policy "events_owner" on events using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Finance: Transactions ─────────────────────────────────────────────────
create table if not exists transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  amount       numeric(15,2) not null,
  type         text not null,
  category     text,
  description  text,
  date         date not null default current_date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table transactions enable row level security;
create policy "transactions_owner" on transactions using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Finance: Budgets ──────────────────────────────────────────────────────
create table if not exists budgets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  category     text not null,
  amount       numeric(15,2) not null,
  period       text not null default 'monthly',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table budgets enable row level security;
create policy "budgets_owner" on budgets using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Finance: Savings Goals ────────────────────────────────────────────────
create table if not exists savings_goals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  target       numeric(15,2) not null,
  current      numeric(15,2) not null default 0,
  deadline     date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table savings_goals enable row level security;
create policy "savings_goals_owner" on savings_goals using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Relationships: Contacts ───────────────────────────────────────────────
create table if not exists contacts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  email        text,
  phone        text,
  company      text,
  role         text,
  tags         text[],
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table contacts enable row level security;
create policy "contacts_owner" on contacts using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Relationships: Meeting Logs ───────────────────────────────────────────
create table if not exists meetings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  contact_id   uuid references contacts(id) on delete set null,
  title        text not null,
  date         timestamptz not null default now(),
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table meetings enable row level security;
create policy "meetings_owner" on meetings using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Learning: Goals ───────────────────────────────────────────────────────
create table if not exists learning_goals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  description  text,
  target_date  date,
  status       text not null default 'active',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table learning_goals enable row level security;
create policy "learning_goals_owner" on learning_goals using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Learning: Books ───────────────────────────────────────────────────────
create table if not exists books (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  author       text,
  status       text not null default 'to-read',
  rating       smallint,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table books enable row level security;
create policy "books_owner" on books using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Learning: Study Logs ──────────────────────────────────────────────────
create table if not exists study_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  goal_id      uuid references learning_goals(id) on delete set null,
  duration_min integer not null,
  topic        text,
  notes        text,
  date         date not null default current_date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table study_logs enable row level security;
create policy "study_logs_owner" on study_logs using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Learning: Flashcards ──────────────────────────────────────────────────
create table if not exists flashcards (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  goal_id         uuid references learning_goals(id) on delete set null,
  front           text not null,
  back            text not null,
  ease_factor     numeric(4,2) not null default 2.5,
  interval_days   integer not null default 1,
  repetitions     integer not null default 0,
  next_review     date not null default current_date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table flashcards enable row level security;
create policy "flashcards_owner" on flashcards using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Career: Skills ────────────────────────────────────────────────────────
create table if not exists skills (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  level        smallint not null default 1,
  category     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table skills enable row level security;
create policy "skills_owner" on skills using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Career: Achievements ──────────────────────────────────────────────────
create table if not exists achievements (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  description  text,
  date         date,
  impact       text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table achievements enable row level security;
create policy "achievements_owner" on achievements using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Career: Goals ─────────────────────────────────────────────────────────
create table if not exists career_goals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  description  text,
  target_date  date,
  status       text not null default 'active',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table career_goals enable row level security;
create policy "career_goals_owner" on career_goals using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Career: Job Applications ──────────────────────────────────────────────
create table if not exists job_applications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  company      text not null,
  role         text not null,
  status       text not null default 'applied',
  applied_date date,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table job_applications enable row level security;
create policy "job_applications_owner" on job_applications using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Career: Growth Journals ───────────────────────────────────────────────
create table if not exists growth_journals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  content      text,
  mood         text,
  date         date not null default current_date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table growth_journals enable row level security;
create policy "growth_journals_owner" on growth_journals using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Career: Certifications ────────────────────────────────────────────────
create table if not exists certifications (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  name                  text not null,
  issuer                text,
  date                  date,
  expiry_date           date,
  linked_learning_goal_id uuid references learning_goals(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
alter table certifications enable row level security;
create policy "certifications_owner" on certifications using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Career: Work Logs ─────────────────────────────────────────────────────
create table if not exists work_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  date         date not null default current_date,
  hours        numeric(4,1) not null,
  project      text,
  description  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table work_logs enable row level security;
create policy "work_logs_owner" on work_logs using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Career: Salary Records ────────────────────────────────────────────────
create table if not exists salary_records (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  amount       numeric(15,2) not null,
  currency     text not null default 'KRW',
  effective_date date not null,
  company      text,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table salary_records enable row level security;
create policy "salary_records_owner" on salary_records using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Career: Targets ───────────────────────────────────────────────────────
create table if not exists career_targets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  description  text,
  target_date  date,
  status       text not null default 'active',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table career_targets enable row level security;
create policy "career_targets_owner" on career_targets using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Career: Career Paths (AI coach) ──────────────────────────────────────
create table if not exists career_paths (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  description  text,
  is_selected  boolean not null default false,
  milestones   jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table career_paths enable row level security;
create policy "career_paths_owner" on career_paths using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Career: Coach Logs ────────────────────────────────────────────────────
create table if not exists coach_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null,
  content      text not null,
  created_at   timestamptz not null default now()
);
alter table coach_logs enable row level security;
create policy "coach_logs_owner" on coach_logs using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Health: Workouts ──────────────────────────────────────────────────────
create table if not exists workouts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  type         text not null,
  duration_min integer not null,
  intensity    text,
  calories     integer,
  notes        text,
  date         date not null default current_date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table workouts enable row level security;
create policy "workouts_owner" on workouts using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Health: Sleep Logs ────────────────────────────────────────────────────
create table if not exists sleep_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  hours        numeric(3,1) not null,
  quality      smallint,
  bed_time     timestamptz,
  wake_time    timestamptz,
  notes        text,
  date         date not null default current_date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table sleep_logs enable row level security;
create policy "sleep_logs_owner" on sleep_logs using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Health: Weight Logs ───────────────────────────────────────────────────
create table if not exists weight_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  weight_kg    numeric(5,2) not null,
  notes        text,
  date         date not null default current_date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table weight_logs enable row level security;
create policy "weight_logs_owner" on weight_logs using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Health: Water Logs ────────────────────────────────────────────────────
create table if not exists water_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  amount_ml    integer not null,
  date         date not null default current_date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table water_logs enable row level security;
create policy "water_logs_owner" on water_logs using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Health: Steps Logs ────────────────────────────────────────────────────
create table if not exists steps_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  steps        integer not null,
  date         date not null default current_date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table steps_logs enable row level security;
create policy "steps_logs_owner" on steps_logs using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Health: Mood Logs ─────────────────────────────────────────────────────
create table if not exists mood_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  mood         smallint not null,
  notes        text,
  date         date not null default current_date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table mood_logs enable row level security;
create policy "mood_logs_owner" on mood_logs using (user_id = auth.uid()) with check (user_id = auth.uid());
