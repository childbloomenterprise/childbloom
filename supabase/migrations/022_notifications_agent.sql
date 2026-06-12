-- 022_notifications_agent.sql
-- Agent notifications (streak_risk, recap_ready) ride the EXISTING
-- public.notifications table (created Dr-Bloom-side). Live schema verified
-- 2026-06-12: all columns present (recipient_id, type, title, body, data,
-- is_read, read_at, sender_*), RLS "Users: full access to own notifications"
-- (recipient_id = auth.uid()) covers select/update/mark-read, and the table
-- is already in the supabase_realtime publication.
--
-- Only gap: a composite index for the inbox query ordered by recency.
-- Idempotent — safe to paste into the Supabase SQL editor.

create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);
