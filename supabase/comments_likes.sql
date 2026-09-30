-- Run this once in Supabase Dashboard > SQL Editor.
-- Also enable "Anonymous sign-ins" in Authentication > Providers.

ALTER TABLE public.comments
  ALTER COLUMN likes SET DEFAULT 0,
  ALTER COLUMN likes SET NOT NULL;

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS replies jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS liked_by_admin boolean DEFAULT false;

DROP POLICY IF EXISTS "Allow public update comments" ON public.comments;
CREATE POLICY "Allow public update comments"
  ON public.comments FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.comment_likes (
  comment_id bigint NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id
  ON public.comment_likes(user_id);

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Visitors can read their own comment likes" ON public.comment_likes;
CREATE POLICY "Visitors can read their own comment likes"
  ON public.comment_likes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Visitors can add their own comment likes" ON public.comment_likes;
CREATE POLICY "Visitors can add their own comment likes"
  ON public.comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Visitors can remove their own comment likes" ON public.comment_likes;
CREATE POLICY "Visitors can remove their own comment likes"
  ON public.comment_likes FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.sync_comment_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.comments SET likes = likes + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  END IF;

  UPDATE public.comments SET likes = GREATEST(likes - 1, 0) WHERE id = OLD.comment_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS comment_like_count_trigger ON public.comment_likes;
CREATE TRIGGER comment_like_count_trigger
AFTER INSERT OR DELETE ON public.comment_likes
FOR EACH ROW EXECUTE FUNCTION public.sync_comment_like_count();
