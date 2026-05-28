-- =========================================================================
-- CORRECTIF COMPLET POUR LA TABLE 'scan_history' (DÉBLOCAGE NOT-NULL CONSTRAINT)
-- =========================================================================
-- Copiez et collez l'intégralité de ce script dans le "SQL Editor" de votre 
-- tableau de bord Supabase (https://app.supabase.com/), puis cliquez sur "Run".
-- =========================================================================

-- 1. Ajout de la colonne 'epc' (si manquante)
ALTER TABLE public.scan_history ADD COLUMN IF NOT EXISTS epc TEXT;

-- 2. Ajout des colonnes requises manquantes dans 'scan_history'
ALTER TABLE public.scan_history ADD COLUMN IF NOT EXISTS outillage_id UUID REFERENCES public.outillages(id);
ALTER TABLE public.scan_history ADD COLUMN IF NOT EXISTS rssi INTEGER;
ALTER TABLE public.scan_history ADD COLUMN IF NOT EXISTS scanned_by TEXT;
ALTER TABLE public.scan_history ADD COLUMN IF NOT EXISTS site TEXT;
ALTER TABLE public.scan_history ADD COLUMN IF NOT EXISTS scanned_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Rendre 'project_id', 'user_id' et 'start_time' facultatifs (nullable) dans 'scan_history'
-- Cela évite les erreurs lors de scans libres ou globaux hors projet
ALTER TABLE public.scan_history ALTER COLUMN project_id DROP NOT NULL;
ALTER TABLE public.scan_history ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.scan_history ALTER COLUMN start_time DROP NOT NULL;

-- 4. Rechargement forcé du cache d'API de Supabase
NOTIFY pgrst, 'reload schema';

-- ✅ Table 'scan_history' débloquée avec succès !