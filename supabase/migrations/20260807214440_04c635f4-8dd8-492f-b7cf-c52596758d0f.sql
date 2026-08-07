CREATE OR REPLACE FUNCTION public.platform_events_immutable()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.id IS NOT DISTINCT FROM OLD.id
     AND NEW.event_type IS NOT DISTINCT FROM OLD.event_type
     AND NEW.event_version IS NOT DISTINCT FROM OLD.event_version
     AND NEW.organization_id IS NOT DISTINCT FROM OLD.organization_id
     AND NEW.user_id IS NOT DISTINCT FROM OLD.user_id
     AND NEW.product IS NOT DISTINCT FROM OLD.product
     AND NEW.environment IS NOT DISTINCT FROM OLD.environment
     AND NEW.source IS NOT DISTINCT FROM OLD.source
     AND NEW.occurred_at IS NOT DISTINCT FROM OLD.occurred_at
     AND NEW.context IS NOT DISTINCT FROM OLD.context
     AND NEW.payload IS NOT DISTINCT FROM OLD.payload
     AND NEW.dedupe_key IS NOT DISTINCT FROM OLD.dedupe_key
     AND NEW.created_at IS NOT DISTINCT FROM OLD.created_at THEN
    RETURN NEW;
  END IF;

  -- Account deletion anonymizes the audit trail: allow user_id/organization_id
  -- to be nulled by the ON DELETE SET NULL foreign keys, nothing else.
  IF TG_OP = 'UPDATE'
     AND NEW.id IS NOT DISTINCT FROM OLD.id
     AND NEW.event_type IS NOT DISTINCT FROM OLD.event_type
     AND NEW.event_version IS NOT DISTINCT FROM OLD.event_version
     AND NEW.product IS NOT DISTINCT FROM OLD.product
     AND NEW.environment IS NOT DISTINCT FROM OLD.environment
     AND NEW.source IS NOT DISTINCT FROM OLD.source
     AND NEW.occurred_at IS NOT DISTINCT FROM OLD.occurred_at
     AND NEW.context IS NOT DISTINCT FROM OLD.context
     AND NEW.payload IS NOT DISTINCT FROM OLD.payload
     AND NEW.dedupe_key IS NOT DISTINCT FROM OLD.dedupe_key
     AND NEW.created_at IS NOT DISTINCT FROM OLD.created_at
     AND (NEW.user_id IS NOT DISTINCT FROM OLD.user_id OR NEW.user_id IS NULL)
     AND (NEW.organization_id IS NOT DISTINCT FROM OLD.organization_id OR NEW.organization_id IS NULL) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'platform_events rows are immutable';
END;
$function$;