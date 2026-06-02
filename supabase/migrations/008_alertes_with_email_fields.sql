CREATE OR REPLACE FUNCTION public.trigger_send_alert_email()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://xbksybexxcahnlmbdynm.supabase.co/functions/v1/send-alert-email',
      headers := json_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhia3N5YmV4eGNhaG5sbWJkeW5tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ4NDEzMiwiZXhwIjoyMDk1MDYwMTMyfQ.Qoor2VJfHBSFYmOHBgk8mPpPXcxi6qrJmt8a0b-IF_A'
      )::jsonb,
      body := json_build_object('alerteId', NEW.id)::jsonb
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_send_alert_email ON public.alertes;
CREATE TRIGGER trigger_send_alert_email
  AFTER INSERT ON public.alertes
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_send_alert_email();