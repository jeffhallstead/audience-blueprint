DELETE FROM public.saved_recommendations a
USING public.saved_recommendations b
WHERE a.user_id = b.user_id
  AND a.title = b.title
  AND a.document_id IS NOT DISTINCT FROM b.document_id
  AND a.status <> 'archived' AND b.status <> 'archived'
  AND a.created_at > b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS saved_recommendations_unique_active
  ON public.saved_recommendations (user_id, document_id, title)
  WHERE status <> 'archived';