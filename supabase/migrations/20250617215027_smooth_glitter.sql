/*
  # Schéma complet Chefito - Système de scraping et IA culinaire

  1. Tables principales
    - `recipes_raw` - Recettes brutes scrapées
    - `recipes_clean` - Recettes nettoyées et validées
    - `steps_raw` - Étapes brutes des recettes
    - `steps_clean` - Étapes nettoyées avec métadonnées
    - `steps_audio` - Fichiers audio des étapes
    - `correction_logs` - Logs des corrections pour l'apprentissage IA
    - `scraping_sessions` - Sessions de scraping
    - `ai_training_data` - Données d'entraînement IA

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies pour l'accès authentifié

  3. Fonctionnalités
    - Hash unique pour éviter les doublons audio
    - Système de statuts pour le workflow
    - Métadonnées complètes pour l'IA
*/

-- Table des sessions de scraping
CREATE TABLE IF NOT EXISTS scraping_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'spoonacular',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  recipes_scraped integer DEFAULT 0,
  errors_count integer DEFAULT 0,
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Table des recettes brutes (directement scrapées)
CREATE TABLE IF NOT EXISTS recipes_raw (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scraping_session_id uuid REFERENCES scraping_sessions(id),
  external_id text,
  title text NOT NULL,
  description text,
  ingredients jsonb DEFAULT '[]',
  instructions jsonb DEFAULT '[]',
  cook_time integer,
  prep_time integer,
  total_time integer,
  servings integer,
  difficulty text,
  cuisine_type text,
  tags jsonb DEFAULT '[]',
  nutrition jsonb DEFAULT '{}',
  image_url text,
  source_url text,
  scraped_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'corrected', 'rejected')),
  hash text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Table des recettes nettoyées et validées
CREATE TABLE IF NOT EXISTS recipes_clean (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_recipe_id uuid REFERENCES recipes_raw(id),
  title text NOT NULL,
  description text,
  ingredients jsonb DEFAULT '[]',
  cook_time integer,
  prep_time integer,
  total_time integer,
  servings integer,
  difficulty text,
  cuisine_type text,
  tags jsonb DEFAULT '[]',
  nutrition jsonb DEFAULT '{}',
  image_url text,
  status text DEFAULT 'validated' CHECK (status IN ('validated', 'published', 'archived')),
  corrected_by text DEFAULT 'ai',
  corrected_at timestamptz DEFAULT now(),
  validation_score numeric(3,2) DEFAULT 0.0,
  created_at timestamptz DEFAULT now()
);

-- Table des étapes brutes
CREATE TABLE IF NOT EXISTS steps_raw (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid REFERENCES recipes_raw(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  instruction text NOT NULL,
  duration_estimate integer,
  temperature text,
  tools jsonb DEFAULT '[]',
  ingredients_used jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- Table des étapes nettoyées
CREATE TABLE IF NOT EXISTS steps_clean (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid REFERENCES recipes_clean(id) ON DELETE CASCADE,
  raw_step_id uuid REFERENCES steps_raw(id),
  step_number integer NOT NULL,
  instruction text NOT NULL,
  duration_estimate integer,
  temperature text,
  tools jsonb DEFAULT '[]',
  ingredients_used jsonb DEFAULT '[]',
  action_type text,
  difficulty_level integer DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  tips text,
  warnings text,
  created_at timestamptz DEFAULT now()
);

-- Table des fichiers audio
CREATE TABLE IF NOT EXISTS steps_audio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id uuid REFERENCES steps_clean(id) ON DELETE CASCADE,
  instruction_hash text NOT NULL,
  audio_url text NOT NULL,
  provider text DEFAULT 'elevenlabs' CHECK (provider IN ('elevenlabs', 'gtts', 'local')),
  duration_seconds numeric(5,2),
  file_size_bytes integer,
  quality text DEFAULT 'standard',
  language text DEFAULT 'fr',
  voice_id text,
  generated_at timestamptz DEFAULT now(),
  status text DEFAULT 'ready' CHECK (status IN ('generating', 'ready', 'failed')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(instruction_hash)
);

-- Table des logs de correction pour l'apprentissage IA
CREATE TABLE IF NOT EXISTS correction_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid REFERENCES recipes_raw(id),
  correction_type text NOT NULL CHECK (correction_type IN ('manual', 'ai', 'hybrid')),
  field_corrected text NOT NULL,
  original_value text,
  corrected_value text,
  confidence_score numeric(3,2),
  corrector_id text,
  correction_reason text,
  created_at timestamptz DEFAULT now()
);

-- Table des données d'entraînement IA
CREATE TABLE IF NOT EXISTS ai_training_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  input_text text NOT NULL,
  expected_output text NOT NULL,
  correction_type text NOT NULL,
  confidence_score numeric(3,2) DEFAULT 1.0,
  source_recipe_id uuid REFERENCES recipes_raw(id),
  validated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Table des métriques système
CREATE TABLE IF NOT EXISTS system_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL,
  metric_value numeric,
  metric_unit text,
  recorded_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Indexes pour les performances
CREATE INDEX IF NOT EXISTS idx_recipes_raw_status ON recipes_raw(status);
CREATE INDEX IF NOT EXISTS idx_recipes_raw_scraped_at ON recipes_raw(scraped_at);
CREATE INDEX IF NOT EXISTS idx_recipes_raw_hash ON recipes_raw(hash);
CREATE INDEX IF NOT EXISTS idx_recipes_clean_status ON recipes_clean(status);
CREATE INDEX IF NOT EXISTS idx_steps_audio_hash ON steps_audio(instruction_hash);
CREATE INDEX IF NOT EXISTS idx_correction_logs_recipe ON correction_logs(recipe_id);
CREATE INDEX IF NOT EXISTS idx_system_metrics_name_time ON system_metrics(metric_name, recorded_at);

-- Enable RLS
ALTER TABLE scraping_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes_clean ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps_clean ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps_audio ENABLE ROW LEVEL SECURITY;
ALTER TABLE correction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies (pour l'instant, accès total pour les utilisateurs authentifiés)
CREATE POLICY "Allow all for authenticated users" ON scraping_sessions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON recipes_raw
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON recipes_clean
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON steps_raw
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON steps_clean
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON steps_audio
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON correction_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON ai_training_data
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON system_metrics
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Fonctions utilitaires
CREATE OR REPLACE FUNCTION generate_instruction_hash(instruction text)
RETURNS text AS $$
BEGIN
  RETURN encode(digest(instruction, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer les métriques
CREATE OR REPLACE FUNCTION update_system_metrics()
RETURNS void AS $$
BEGIN
  -- Nombre total de recettes
  INSERT INTO system_metrics (metric_name, metric_value, metric_unit)
  VALUES ('total_recipes', (SELECT COUNT(*) FROM recipes_raw), 'count');
  
  -- Recettes validées
  INSERT INTO system_metrics (metric_name, metric_value, metric_unit)
  VALUES ('validated_recipes', (SELECT COUNT(*) FROM recipes_clean WHERE status = 'validated'), 'count');
  
  -- Audio générés
  INSERT INTO system_metrics (metric_name, metric_value, metric_unit)
  VALUES ('audio_generated', (SELECT COUNT(*) FROM steps_audio WHERE status = 'ready'), 'count');
  
  -- Taux de correction automatique
  INSERT INTO system_metrics (metric_name, metric_value, metric_unit)
  VALUES ('ai_correction_rate', 
    (SELECT COALESCE(
      (COUNT(*) FILTER (WHERE correction_type = 'ai')::numeric / NULLIF(COUNT(*), 0)) * 100, 
      0
    ) FROM correction_logs WHERE created_at > now() - interval '24 hours'), 
    'percentage');
END;
$$ LANGUAGE plpgsql;