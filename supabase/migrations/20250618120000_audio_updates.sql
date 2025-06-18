-- Migration: audio updates and quota tracking

-- Add audio_id to steps_clean for reuse logic
ALTER TABLE steps_clean
  ADD COLUMN IF NOT EXISTS audio_id uuid REFERENCES steps_audio(id);

-- Add source column to steps_audio
ALTER TABLE steps_audio
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'elevenlabs' CHECK (source IN ('elevenlabs','gtts'));

-- Index on steps_audio(step_id)
CREATE INDEX IF NOT EXISTS idx_step_id ON steps_audio(step_id);

-- Table to track ElevenLabs quota usage
CREATE TABLE IF NOT EXISTS audio_quota (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  used_chars integer DEFAULT 0,
  quota_limit integer DEFAULT 100000,
  updated_at timestamptz DEFAULT now()
);

-- Unique metric entries per day
ALTER TABLE system_metrics
  ADD CONSTRAINT IF NOT EXISTS unique_metric_day UNIQUE (metric_name, recorded_at);

-- Replace update_system_metrics function with upsert logic
DROP FUNCTION IF EXISTS update_system_metrics();
CREATE OR REPLACE FUNCTION update_system_metrics()
RETURNS void AS $$
DECLARE record_time timestamptz := date_trunc('day', now());
BEGIN
  INSERT INTO system_metrics(metric_name, metric_value, metric_unit, recorded_at)
  VALUES ('total_recipes', (SELECT COUNT(*) FROM recipes_raw), 'count', record_time)
  ON CONFLICT (metric_name, recorded_at)
  DO UPDATE SET metric_value = EXCLUDED.metric_value, metric_unit = EXCLUDED.metric_unit;

  INSERT INTO system_metrics(metric_name, metric_value, metric_unit, recorded_at)
  VALUES ('validated_recipes', (SELECT COUNT(*) FROM recipes_clean WHERE status = 'validated'), 'count', record_time)
  ON CONFLICT (metric_name, recorded_at)
  DO UPDATE SET metric_value = EXCLUDED.metric_value, metric_unit = EXCLUDED.metric_unit;

  INSERT INTO system_metrics(metric_name, metric_value, metric_unit, recorded_at)
  VALUES ('audio_generated', (SELECT COUNT(*) FROM steps_audio WHERE status = 'ready'), 'count', record_time)
  ON CONFLICT (metric_name, recorded_at)
  DO UPDATE SET metric_value = EXCLUDED.metric_value, metric_unit = EXCLUDED.metric_unit;
END;
$$ LANGUAGE plpgsql;
