CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'dispatch-integration-outbox',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--6d4e5e38-ebb7-4aa9-b55b-9a7cad324fe2.lovable.app/api/public/integrations/dispatch',
    headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_cQ8U679yJmaawu_XOlvxzQ_DTWLCpPY"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);