-- HaresvaMi - move dish ratings to a 1-5 star scale.
-- Apply after 0008_drop_public_feedback_write_policies.sql.

ALTER TABLE public.feedback_ratings
  DROP CONSTRAINT IF EXISTS feedback_ratings_rating_check;

ALTER TABLE public.feedback_ratings
  ADD CONSTRAINT feedback_ratings_rating_check
  CHECK (rating BETWEEN 1 AND 5);
