// Initialisation Supabase (navigateur)
// IMPORTANT: la clé anon est publique (RLS doit être activé côté Supabase)

// Renseigne tes valeurs si besoin (sinon celles-ci restent celles déjà utilisées)
export const SUPABASE_URL = "https://lttzfsxlgsvwpeapvypf.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0dHpmc3hsZ3N2d3BlYXB2eXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjMwNDMsImV4cCI6MjA3NzM5OTA0M30.PPFsKpsX3_N_syS9bhgNN94X39Y4mmB-YigbaDPo2Uk";

// Identifiant logique du site (champ site_key côté BDD)
export const SITE_KEY = "hurghada_dream_0606";

// Client supabase-js via CDN global
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


