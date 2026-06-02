-- =============================================================================
-- Table stock_movements + accès web (clé anon, comme outillages / scan_history)
-- Erreur corrigée : "Could not find the table 'public.stock_movements'"
-- Supabase → SQL Editor → coller tout → Run
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

CREATE INDEX IF NOT EXISTS idx_stock_movements_outillage
  ON public.stock_movements (outillage_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_modified_at
  ON public.stock_movements (modified_at DESC);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Politiques ouvertes pour le dashboard web (même modèle que outillages)
DROP POLICY IF EXISTS "Public read stock_movements" ON public.stock_movements;
CREATE POLICY "Public read stock_movements"
  ON public.stock_movements FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public insert stock_movements" ON public.stock_movements;
CREATE POLICY "Public insert stock_movements"
  ON public.stock_movements FOR INSERT
  WITH CHECK (true);

-- Anciennes politiques (migration 004, rôle authenticated uniquement)
DROP POLICY IF EXISTS "Utilisateurs connectés peuvent lire l'historique" ON public.stock_movements;
DROP POLICY IF EXISTS "Trigger système/utilisateurs connectés peuvent enregistrer" ON public.stock_movements;

-- Recharger le cache schéma PostgREST (corrige "schema cache")
NOTIFY pgrst, 'reload schema';

-- Vérification
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'stock_movements'
ORDER BY ordinal_position;
