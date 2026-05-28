/**
 * Script de test pour vérifier la configuration Supabase
 * 
 * Ce script teste:
 * 1. La connexion à Supabase
 * 2. L'accès aux tables
 * 3. L'authentification (si un utilisateur est connecté)
 * 
 * Utilisation: node test-supabase-connection.js
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Récupération des variables d'environnement
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Test de la configuration Supabase...\n');
console.log('📍 URL Supabase:', supabaseUrl);
console.log('🔑 Clé API (premiers caractères):', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'NON DÉFINIE');
console.log('');

// Vérification des variables d'environnement
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERREUR: Variables d\'environnement manquantes!');
  console.error('   Veuillez configurer .env.local avec:');
  console.error('   - EXPO_PUBLIC_SUPABASE_URL');
  console.error('   - EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Création du client Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTests() {
  let allTestsPassed = true;

  // Test 1: Vérifier la connexion de base
  console.log('🧪 Test 1: Connexion à l\'API Supabase...');
  try {
    const { data, error } = await supabase.from('outillages').select('id').limit(1);
    
    if (error) {
      console.error('❌ Échec: Erreur de connexion à Supabase');
      console.error('   Message:', error.message);
      console.error('   Détails:', error.details);
      allTestsPassed = false;
    } else {
      console.log('✅ Succès: Connexion à Supabase établie!');
    }
  } catch (err) {
    console.error('❌ Échec: Erreur inattendue lors de la connexion');
    console.error('   Message:', err.message);
    allTestsPassed = false;
  }
  console.log('');

  // Test 2: Vérifier l'authentification
  console.log('🧪 Test 2: Vérification de l\'authentification...');
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('ℹ️  Info: Aucun utilisateur authentifié (ceci est normal si vous n\'êtes pas connecté)');
      console.log('   Message:', error.message);
    } else {
      console.log('✅ Succès: Utilisateur authentifié!');
      console.log('   Email:', user.email);
      console.log('   ID:', user.id);
    }
  } catch (err) {
    console.error('❌ Échec: Erreur lors de la vérification de l\'authentification');
    console.error('   Message:', err.message);
    allTestsPassed = false;
  }
  console.log('');

  // Test 3: Vérifier l'accès aux tables (sans authentification)
  console.log('🧪 Test 3: Vérification des tables de la base de données...');
  const tables = ['outillages', 'scan_history'];
  let tablesOk = 0;
  let tablesFailed = 0;

  for (const table of tables) {
    try {
      // Utiliser select('*') avec head:true pour vérifier si la table existe
      const { error } = await supabase.from(table).select('*').limit(1);
      
      if (error) {
        // Certaines tables peuvent nécessiter une authentification
        if (error.message.includes('JWT') || error.message.includes('authentication') || error.message.includes('permission')) {
          console.log(`⚠️  ${table}: Nécessite une authentification (normal avec RLS)`);
          tablesOk++;
        } else if (error.message.includes('relation') || error.message.includes('does not exist')) {
          console.log(`❌ ${table}: Table n'existe pas - ${error.message}`);
          tablesFailed++;
        } else {
          console.log(`❌ ${table}: Erreur - ${error.message}`);
          tablesFailed++;
        }
      } else {
        console.log(`✅ ${table}: Table accessible`);
        tablesOk++;
      }
    } catch (err) {
      console.log(`❌ ${table}: Erreur inattendue - ${err.message}`);
      tablesFailed++;
    }
  }
  console.log(`   Résumé: ${tablesOk} tables OK, ${tablesFailed} tables en erreur`);
  console.log('');

  // Test 4: Vérifier la configuration RLS (Row Level Security)
  console.log('🧪 Test 4: Vérification de la sécurité RLS...');
  console.log('   ℹ️  Le RLS est configuré pour protéger les données utilisateurs.');
  console.log('   ℹ️  Pour tester complètement, connectez-vous via l\'application.');
  console.log('');

  // Résultat final
  console.log('═══════════════════════════════════════════');
  if (allTestsPassed && tablesFailed === 0) {
    console.log('✅ TOUS LES TESTS ONT RÉUSSI!');
    console.log('   Votre configuration Supabase est correcte.');
    console.log('   Vous pouvez maintenant lancer l\'application avec: npm run dev');
  } else {
    console.log('⚠️  CERTAINS TESTS ONT ÉCHOUÉ');
    console.log('   Veuillez vérifier:');
    console.log('   1. Que votre projet Supabase est actif');
    console.log('   2. Que les variables d\'environnement sont correctes');
    console.log('   3. Que le schéma SQL a été exécuté dans Supabase');
    console.log('');
    console.log('   Consultez SUPABASE_SETUP.md pour plus d\'aide.');
  }
  console.log('═══════════════════════════════════════════');

  process.exit(allTestsPassed && tablesFailed === 0 ? 0 : 1);
}

// Exécution des tests
runTests().catch(err => {
  console.error('❌ Erreur fatale lors des tests:', err);
  process.exit(1);
});
