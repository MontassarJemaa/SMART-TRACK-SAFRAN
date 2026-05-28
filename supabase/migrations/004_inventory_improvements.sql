-- =========================================================================
-- MODULE INVENTAIRE - AMÉLIORATION DE LA TRACABILITÉ ET PERSISTANCE (SAFRAN SMART TRACK)
-- =========================================================================
-- Copiez et collez l'intégralité de ce script dans le "SQL Editor" de votre 
-- tableau de bord Supabase (https://app.supabase.com/), puis cliquez sur "Run".
-- =========================================================================

-- 1. Table des mouvements de stock (Traçabilité historique complète)
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    outillage_id UUID NOT NULL REFERENCES public.outillages(id) ON DELETE CASCADE,
    code_outillage TEXT NOT NULL,
    site_depart TEXT,
    site_arrivee TEXT,
    statut_depart TEXT,
    statut_arrivee TEXT,
    modified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    modified_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- 2. Table des campagnes d'inventaire (Persister les audits réalisés)
CREATE TABLE IF NOT EXISTS public.inventory_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    site TEXT NOT NULL,
    atelier TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'en_cours' CHECK (status IN ('en_cours', 'complete', 'annule')),
    total_expected INTEGER DEFAULT 0,
    total_found INTEGER DEFAULT 0,
    total_missing INTEGER DEFAULT 0,
    total_unexpected INTEGER DEFAULT 0
);

-- 3. Détails de la campagne (État de chaque outillage lors de l'inventaire)
CREATE TABLE IF NOT EXISTS public.inventory_campaign_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES public.inventory_campaigns(id) ON DELETE CASCADE,
    outillage_id UUID REFERENCES public.outillages(id) ON DELETE SET NULL,
    epc TEXT NOT NULL,
    code TEXT,
    designation TEXT,
    status TEXT NOT NULL CHECK (status IN ('present', 'manquant', 'inattendu')),
    scanned_at TIMESTAMPTZ
);

-- 4. Triggers pour l'écriture automatique de l'historique des mouvements
CREATE OR REPLACE FUNCTION log_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.localisation_actuelle IS DISTINCT FROM NEW.localisation_actuelle) OR 
       (OLD.statut IS DISTINCT FROM NEW.statut) THEN
        INSERT INTO public.stock_movements (
            outillage_id,
            code_outillage,
            site_depart,
            site_arrivee,
            statut_depart,
            statut_arrivee,
            modified_by,
            notes
        ) VALUES (
            NEW.id,
            NEW.code,
            OLD.localisation_actuelle,
            NEW.localisation_actuelle,
            OLD.statut,
            NEW.statut,
            auth.uid(),
            'Mise à jour automatique suite au changement d''état de l''outillage'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_log_stock_movement
    AFTER UPDATE ON public.outillages
    FOR EACH ROW
    EXECUTE FUNCTION log_stock_movement();

-- 5. Indexation de performance (Requêtes d'inventaire instantanées)
CREATE INDEX IF NOT EXISTS idx_outillages_site_atelier ON public.outillages (localisation_actuelle, atelier);
CREATE INDEX IF NOT EXISTS idx_outillages_statut ON public.outillages (statut);
CREATE INDEX IF NOT EXISTS idx_stock_movements_outillage ON public.stock_movements (outillage_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_outillage ON public.scan_history (outillage_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_scanned_at ON public.scan_history (scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_inv_campaigns_status ON public.inventory_campaigns (status);
CREATE INDEX IF NOT EXISTS idx_inv_details_campaign ON public.inventory_campaign_details (campaign_id);

-- 6. Sécurité : Activation de la Row Level Security (RLS)
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_campaign_details ENABLE ROW LEVEL SECURITY;

-- 7. Politiques RLS adaptées (Utilisateurs connectés uniquement)
-- stock_movements
DROP POLICY IF EXISTS "Utilisateurs connectés peuvent lire l'historique" ON public.stock_movements;
CREATE POLICY "Utilisateurs connectés peuvent lire l'historique" 
    ON public.stock_movements FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Trigger système/utilisateurs connectés peuvent enregistrer" ON public.stock_movements;
CREATE POLICY "Trigger système/utilisateurs connectés peuvent enregistrer" 
    ON public.stock_movements FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- inventory_campaigns
DROP POLICY IF EXISTS "Utilisateurs connectés peuvent lire les campagnes" ON public.inventory_campaigns;
CREATE POLICY "Utilisateurs connectés peuvent lire les campagnes" 
    ON public.inventory_campaigns FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Utilisateurs connectés peuvent créer/modifier des campagnes" ON public.inventory_campaigns;
CREATE POLICY "Utilisateurs connectés peuvent créer/modifier des campagnes" 
    ON public.inventory_campaigns FOR ALL USING (auth.role() = 'authenticated');

-- inventory_campaign_details
DROP POLICY IF EXISTS "Utilisateurs connectés peuvent lire les détails des campagnes" ON public.inventory_campaign_details;
CREATE POLICY "Utilisateurs connectés peuvent lire les détails des campagnes" 
    ON public.inventory_campaign_details FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Utilisateurs connectés peuvent enregistrer les détails" ON public.inventory_campaign_details;
CREATE POLICY "Utilisateurs connectés peuvent enregistrer les détails" 
    ON public.inventory_campaign_details FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Notification de recharge de schéma de l'API Supabase
NOTIFY pgrst, 'reload schema';
