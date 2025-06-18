import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

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
  // Récupérer les recettes avec pagination
  async getRecipes(page = 1, limit = 20, status?: string) {
    let query = supabase
      .from('recipes_raw')
      .select('*')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    return query;
  },

  // Récupérer une recette avec ses étapes
  async getRecipeWithSteps(recipeId: string) {
    const [recipeResult, stepsResult] = await Promise.all([
      supabase.from('recipes_clean').select('*').eq('id', recipeId).single(),
      supabase.from('steps_clean').select('*').eq('recipe_id', recipeId).order('step_number')
    ]);

    return {
      recipe: recipeResult.data,
      steps: stepsResult.data || [],
      error: recipeResult.error || stepsResult.error
    };
  },

  // Créer une session de scraping
  async createScrapingSession(provider = 'spoonacular', config = {}) {
    return supabase
      .from('scraping_sessions')
      .insert({
        provider,
        config,
        status: 'running'
      })
      .select()
      .single();
  },

  // Ajouter une recette brute
  async addRawRecipe(recipe: Partial<RecipeRaw>) {
    return supabase
      .from('recipes_raw')
      .insert(recipe)
      .select()
      .single();
  },

  // Logger une correction
  async logCorrection(correction: Partial<CorrectionLog>) {
    return supabase
      .from('correction_logs')
      .insert(correction);
  },

  // Générer un hash pour l'audio
  generateInstructionHash(instruction: string): string {
    // Utilisation de crypto-js pour générer un hash
    const CryptoJS = require('crypto-js');
    return CryptoJS.SHA256(instruction.toLowerCase().trim()).toString();
  },

  // Vérifier si l'audio existe déjà
  async checkAudioExists(instructionHash: string) {
    return supabase
      .from('steps_audio')
      .select('*')
      .eq('instruction_hash', instructionHash)
      .single();
  },

  // Récupérer les métriques système
  async getSystemMetrics(hours = 24) {
    return supabase
      .from('system_metrics')
      .select('*')
      .gte('recorded_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('recorded_at', { ascending: false });
  }
};