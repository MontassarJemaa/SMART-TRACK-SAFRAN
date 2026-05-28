require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const outillages = [
  { code: 'FC002298', designation: 'EAFT CAPOT MISE AIR', atelier: 'DRAPAGE', secteur: 'CST 2', famille: 'OUTILLAGES DRAPAGE', projet: 'NH90', longueur_cm: 35, largeur_cm: 28, hauteur_cm: 10, materiau: 'Aluminium', poids_kg: 40, epc: 'E20034120189074000000001', localisation_actuelle: 'CST 2', statut: 'non_trouve' },
  { code: 'FC002300', designation: 'SUPPORT AVANT EAFT', atelier: 'DRAPAGE', secteur: 'CST 2', famille: 'OUTILLAGES DRAPAGE', projet: 'NH90', longueur_cm: 15, largeur_cm: 7, hauteur_cm: 7, materiau: 'Aluminium', poids_kg: 5, epc: 'E20034120189074000000002', localisation_actuelle: 'CST 2', statut: 'non_trouve' },
  { code: 'FC002301', designation: 'SUPPORT ARRIERE EAFT', atelier: 'DRAPAGE', secteur: 'CST 2', famille: 'OUTILLAGES DRAPAGE', projet: 'NH90', longueur_cm: 15, largeur_cm: 14, hauteur_cm: 7, materiau: 'Aluminium', poids_kg: 5, epc: 'E20034120189074000000003', localisation_actuelle: 'CST 2', statut: 'non_trouve' },
  { code: 'FC002302', designation: 'EAFT AILERON DR', atelier: 'DRAPAGE', secteur: 'CST 2', famille: 'OUTILLAGES DRAPAGE', projet: 'NH90', longueur_cm: 35, largeur_cm: 18, hauteur_cm: 20, materiau: 'Aluminium', poids_kg: 50, epc: 'E20034120189074000000004', localisation_actuelle: 'CST 2', statut: 'non_trouve' },
  { code: 'FC002304', designation: 'CADRE CENT AV', atelier: 'DRAPAGE', secteur: 'CST 2', famille: 'OUTILLAGES DRAPAGE', projet: 'NH90', longueur_cm: 90, largeur_cm: 50, hauteur_cm: 30, materiau: 'Carbone', poids_kg: 10, epc: 'E20034120189074000000005', localisation_actuelle: 'CST 2', statut: 'non_trouve' },
  { code: 'FC002305', designation: 'CADRE CENT AR', atelier: 'DRAPAGE', secteur: 'CST 2', famille: 'OUTILLAGES DRAPAGE', projet: 'NH90', longueur_cm: 90, largeur_cm: 50, hauteur_cm: 30, materiau: 'Carbone', poids_kg: 10, epc: 'E20034120189074000000006', localisation_actuelle: 'CST 2', statut: 'non_trouve' },
  { code: 'FC002306', designation: 'CADRE CENT INF1', atelier: 'DRAPAGE', secteur: 'CST 2', famille: 'OUTILLAGES DRAPAGE', projet: 'NH90', longueur_cm: 75, largeur_cm: 45, hauteur_cm: 30, materiau: 'Carbone', poids_kg: 5, epc: 'E20034120189074000000007', localisation_actuelle: 'CST 2', statut: 'non_trouve' },
  { code: 'FC002329', designation: 'CONE ARRIERE EAFT', atelier: 'DRAPAGE', secteur: 'CST 2', famille: 'OUTILLAGES DRAPAGE', projet: 'NH90', longueur_cm: 120, largeur_cm: 100, hauteur_cm: 140, materiau: 'Carbone', poids_kg: 60, epc: 'E20034120189074000000008', localisation_actuelle: 'T6', statut: 'non_trouve' },
  { code: 'FC002330', designation: 'CYLINDRE EAFT', atelier: 'DRAPAGE', secteur: 'CST 2', famille: 'OUTILLAGES DRAPAGE', projet: 'NH90', longueur_cm: 170, largeur_cm: 100, hauteur_cm: 100, materiau: 'Carbone', poids_kg: 50, epc: 'E20034120189074000000009', localisation_actuelle: 'TTR', statut: 'non_trouve' },
  { code: 'FC002331', designation: 'CONE AV EAFT', atelier: 'DRAPAGE', secteur: 'CST 1', famille: 'OUTILLAGES DRAPAGE', projet: 'H160 EFS', longueur_cm: 80, largeur_cm: 60, hauteur_cm: 40, materiau: 'Aluminium', poids_kg: 25, epc: 'E20034120189074000000010', localisation_actuelle: 'CST 1', statut: 'non_trouve' },
];

async function main() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Configure EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY dans .env.local.');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { error: schemaError } = await supabase.from('outillages').select('id').limit(1);

  if (schemaError) {
    throw new Error(
      `La table outillages n'est pas accessible. Execute d'abord supabase/migrations/001_initial_schema.sql dans Supabase SQL Editor. Detail: ${schemaError.message}`
    );
  }

  const { error } = await supabase.from('outillages').upsert(outillages, { onConflict: 'code' });

  if (error) {
    throw error;
  }

  console.log(`${outillages.length} outillages envoyes vers Supabase.`);
}

main().catch((error) => {
  console.error('Seed Supabase echoue:', error.message);
  process.exit(1);
});
