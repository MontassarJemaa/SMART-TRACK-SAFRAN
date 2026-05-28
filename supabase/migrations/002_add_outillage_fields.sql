-- Migration: Ajout des champs 'classe' et 'date_service' à la table outillages
-- Exécutez ce script dans l'éditeur SQL de Supabase pour ajouter les nouvelles colonnes

-- Ajouter la colonne 'classe' (ex: A, B, C, D, E)
ALTER TABLE outillages ADD COLUMN IF NOT EXISTS classe TEXT;

-- Ajouter la colonne 'date_service' (date de mise en service)
ALTER TABLE outillages ADD COLUMN IF NOT EXISTS date_service DATE;

-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'outillages' 
  AND column_name IN ('classe', 'date_service')
ORDER BY ordinal_position;

-- Message de confirmation
-- ✅ Les colonnes 'classe' et 'date_service' ont été ajoutées avec succès