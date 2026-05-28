CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS outillages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  designation TEXT NOT NULL,
  atelier TEXT,
  secteur TEXT,
  famille TEXT,
  projet TEXT,
  longueur_cm NUMERIC,
  largeur_cm NUMERIC,
  hauteur_cm NUMERIC,
  materiau TEXT,
  poids_kg NUMERIC,
  epc TEXT UNIQUE,
  localisation_actuelle TEXT,
  statut TEXT DEFAULT 'non_trouve',
  classe TEXT,
  date_service DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scan_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  outillage_id UUID REFERENCES outillages(id),
  epc TEXT,
  rssi INTEGER,
  scanned_by TEXT,
  site TEXT,
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE outillages ADD COLUMN IF NOT EXISTS localisation_actuelle TEXT;
ALTER TABLE outillages ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'non_trouve';
ALTER TABLE outillages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE outillages ADD COLUMN IF NOT EXISTS classe TEXT;
ALTER TABLE outillages ADD COLUMN IF NOT EXISTS date_service DATE;

ALTER TABLE outillages ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read" ON outillages;
DROP POLICY IF EXISTS "Public insert" ON outillages;
DROP POLICY IF EXISTS "Public update" ON outillages;
DROP POLICY IF EXISTS "Public read history" ON scan_history;
DROP POLICY IF EXISTS "Public insert history" ON scan_history;

CREATE POLICY "Public read" ON outillages FOR SELECT USING (true);
CREATE POLICY "Public insert" ON outillages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON outillages FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public read history" ON scan_history FOR SELECT USING (true);
CREATE POLICY "Public insert history" ON scan_history FOR INSERT WITH CHECK (true);
