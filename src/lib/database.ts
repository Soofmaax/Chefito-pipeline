import { Pool } from 'pg';
import * as CryptoJS from 'crypto-js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params)
};

// Types pour TypeScript
export interface RecipeRaw {
  id: string;
  scraping_session_id?: string;
  external_id?: string;
  title: string;
  description?: string;
  ingredients: any[];
  instructions: any[];
  cook_time?: number;
  prep_time?: number;
  total_time?: number;
  servings?: number;
  difficulty?: string;
  cuisine_type?: string;
  tags: string[];
  nutrition: any;
  image_url?: string;
  source_url?: string;
  scraped_at: string;
  status: 'pending' | 'processing' | 'corrected' | 'rejected';
  hash?: string;
  created_at: string;
}

export interface RecipeClean {
  id: string;
  raw_recipe_id: string;
  title: string;
  description?: string;
  ingredients: any[];
  cook_time?: number;
  prep_time?: number;
  total_time?: number;
  servings?: number;
  difficulty?: string;
  cuisine_type?: string;
  tags: string[];
  nutrition: any;
  image_url?: string;
  status: 'validated' | 'published' | 'archived';
  corrected_by: string;
  corrected_at: string;
  validation_score: number;
  created_at: string;
}

export interface StepClean {
  id: string;
  recipe_id: string;
  raw_step_id?: string;
  audio_id?: string;
  step_number: number;
  instruction: string;
  duration_estimate?: number;
  temperature?: string;
  tools: string[];
  ingredients_used: string[];
  action_type?: string;
  difficulty_level: number;
  tips?: string;
  warnings?: string;
  created_at: string;
}

export interface StepAudio {
  id: string;
  step_id: string;
  instruction_hash: string;
  audio_url: string;
  provider: 'elevenlabs' | 'gtts' | 'local';
  source?: 'elevenlabs' | 'gtts';
  duration_seconds?: number;
  file_size_bytes?: number;
  quality: string;
  language: string;
  voice_id?: string;
  generated_at: string;
  status: 'generating' | 'ready' | 'failed';
  created_at: string;
}

export interface CorrectionLog {
  id: string;
  recipe_id: string;
  correction_type: 'manual' | 'ai' | 'hybrid';
  field_corrected: string;
  original_value?: string;
  corrected_value?: string;
  confidence_score?: number;
  corrector_id?: string;
  correction_reason?: string;
  created_at: string;
}

export interface ScrapingSession {
  id: string;
  provider: string;
  started_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  recipes_scraped: number;
  errors_count: number;
  config: any;
  created_at: string;
}

// Fonctions utilitaires pour la base de données
export const dbUtils = {
  generateInstructionHash(instruction: string): string {
    return CryptoJS.SHA256(instruction.toLowerCase().trim()).toString();
  }
};
