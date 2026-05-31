-- =============================================================================
-- Tables inventory_campaigns / inventory_campaign_details : accès web clé anon
-- Corrige l'échec "Impossible de lancer la campagne" quand le dashboard web
-- utilise les tables créées par 004_inventory_improvements.sql.
-- Supabase -> SQL Editor -> coller tout -> Run
-- =============================================================================

ALTER TABLE public.inventory_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_campaign_details ENABLE ROW LEVEL SECURITY;

-- Politiques ouvertes pour le dashboard web, même modèle que outillages.
DROP POLICY IF EXISTS "Public read inventory_campaigns" ON public.inventory_campaigns;
CREATE POLICY "Public read inventory_campaigns"
  ON public.inventory_campaigns FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public insert inventory_campaigns" ON public.inventory_campaigns;
CREATE POLICY "Public insert inventory_campaigns"
  ON public.inventory_campaigns FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public update inventory_campaigns" ON public.inventory_campaigns;
CREATE POLICY "Public update inventory_campaigns"
  ON public.inventory_campaigns FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public read inventory_campaign_details" ON public.inventory_campaign_details;
CREATE POLICY "Public read inventory_campaign_details"
  ON public.inventory_campaign_details FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public insert inventory_campaign_details" ON public.inventory_campaign_details;
CREATE POLICY "Public insert inventory_campaign_details"
  ON public.inventory_campaign_details FOR INSERT
  WITH CHECK (true);

-- Anciennes politiques (migration 004, rôle authenticated uniquement)
DROP POLICY IF EXISTS "Utilisateurs connectés peuvent lire les campagnes" ON public.inventory_campaigns;
DROP POLICY IF EXISTS "Utilisateurs connectés peuvent créer/modifier des campagnes" ON public.inventory_campaigns;
DROP POLICY IF EXISTS "Utilisateurs connectés peuvent lire les détails des campagnes" ON public.inventory_campaign_details;
DROP POLICY IF EXISTS "Utilisateurs connectés peuvent enregistrer les détails" ON public.inventory_campaign_details;

-- Recharger le cache schéma PostgREST.
NOTIFY pgrst, 'reload schema';
