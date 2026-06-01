DROP TRIGGER IF EXISTS trigger_send_alert_email ON public.alertes CASCADE;
DROP TRIGGER IF EXISTS on_new_alert ON public.alertes CASCADE;
DROP FUNCTION IF EXISTS public.trigger_send_alert_email() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_alert() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_alert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://xbksybexxcahnlmbdynm.supabase.co/functions/v1/send-alert-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhia3N5YmV4eGNhaG5sbWJkeW5tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ4NDEzMiwiZXhwIjoyMDk1MDYwMTMyfQ.Qoor2VJfHBSFYmOHBgk8mPpPXcxi6qrJmt8a0b-IF_A'
    ),
    body := jsonb_build_object('alerteId', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_alert
  AFTER INSERT ON public.alertes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_alert();