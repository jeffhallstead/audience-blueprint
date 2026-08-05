DROP INDEX IF EXISTS public.integration_outbox_dedupe_idx;
CREATE UNIQUE INDEX integration_outbox_dedupe_idx
  ON public.integration_outbox USING btree (provider, dedupe_key);