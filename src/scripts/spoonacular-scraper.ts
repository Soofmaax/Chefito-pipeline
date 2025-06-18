/**
 * Script de scraping Spoonacular
 * À déployer sur votre VPS avec cron job quotidien
 * 
 * Usage: node spoonacular-scraper.js
 * Cron: 0 22 * * * /usr/bin/node /path/to/spoonacular-scraper.js
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Configuration
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SPOONACULAR_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Variables d\'environnement manquantes');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface SpoonacularRecipe {
  id: number;
  title: string;
  summary: string;
  extendedIngredients: any[];
  analyzedInstructions: any[];
  readyInMinutes: number;
  servings: number;
  cuisines: string[];
  dishTypes: string[];
  image: string;
  sourceUrl: string;
  nutrition?: any;
}

class SpoonacularScraper {
  private baseUrl = 'https://api.spoonacular.com/recipes';
  private dailyQuota = 400; // Recettes par jour
  private requestDelay = 1000; // 1 seconde entre les requêtes

  async scrapeRecipes(targetCount = 400): Promise<void> {
    console.log(`🚀 Début du scraping - Objectif: ${targetCount} recettes`);

    // Créer une session de scraping
    const { data: session, error: sessionError } = await supabase
      .from('scraping_sessions')
      .insert({
        provider: 'spoonacular',
        status: 'running',
        config: { target_count: targetCount }
      })
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Erreur création session:', sessionError);
      return;
    }

    let scrapedCount = 0;
    let errorCount = 0;
    const cuisineTypes = ['italian', 'french', 'mexican', 'asian', 'american', 'mediterranean'];
    const dishTypes = ['main course', 'dessert', 'appetizer', 'soup', 'salad'];

    try {
      for (let offset = 0; scrapedCount < targetCount; offset += 20) {
        // Rotation des types de cuisine et plats
        const cuisine = cuisineTypes[Math.floor(Math.random() * cuisineTypes.length)];
        const dishType = dishTypes[Math.floor(Math.random() * dishTypes.length)];

        try {
          const recipes = await this.fetchRecipeBatch(offset, cuisine, dishType);
          
          for (const recipe of recipes) {
            if (scrapedCount >= targetCount) break;

            try {
              await this.processRecipe(recipe, session.id);
              scrapedCount++;
              console.log(`✅ Recette ${scrapedCount}/${targetCount}: ${recipe.title}`);
            } catch (error) {
              errorCount++;
              console.error(`❌ Erreur traitement recette ${recipe.id}:`, error);
            }

            // Délai entre les requêtes
            await this.delay(this.requestDelay);
          }

          if (recipes.length === 0) {
            console.log('⚠️ Aucune nouvelle recette trouvée, arrêt du scraping');
            break;
          }

        } catch (error) {
          errorCount++;
          console.error(`❌ Erreur batch offset ${offset}:`, error);
        }
      }

      // Finaliser la session
      await supabase
        .from('scraping_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          recipes_scraped: scrapedCount,
          errors_count: errorCount
        })
        .eq('id', session.id);

      console.log(`🎉 Scraping terminé: ${scrapedCount} recettes, ${errorCount} erreurs`);

    } catch (error) {
      console.error('❌ Erreur fatale:', error);
      
      await supabase
        .from('scraping_sessions')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          recipes_scraped: scrapedCount,
          errors_count: errorCount
        })
        .eq('id', session.id);
    }
  }

  private async fetchRecipeBatch(offset: number, cuisine: string, dishType: string): Promise<SpoonacularRecipe[]> {
    const params = new URLSearchParams({
      apiKey: SPOONACULAR_API_KEY!,
      number: '20',
      offset: offset.toString(),
      cuisine,
      type: dishType,
      addRecipeInformation: 'true',
      addRecipeNutrition: 'true',
      fillIngredients: 'true'
    });

    const response = await fetch(`${this.baseUrl}/complexSearch?${params}`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  private async processRecipe(recipe: SpoonacularRecipe, sessionId: string): Promise<void> {
    // Générer un hash unique pour éviter les doublons
    const hash = crypto
      .createHash('sha256')
      .update(`${recipe.id}-${recipe.title}`)
      .digest('hex');

    // Vérifier si la recette existe déjà
    const { data: existing } = await supabase
      .from('recipes_raw')
      .select('id')
      .eq('hash', hash)
      .single();

    if (existing) {
      console.log(`⏭️ Recette déjà existante: ${recipe.title}`);
      return;
    }

    // Extraire les ingrédients
    const ingredients = recipe.extendedIngredients?.map(ing => ({
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      original: ing.original
    })) || [];

    // Extraire les instructions
    const instructions = recipe.analyzedInstructions?.[0]?.steps?.map(step => ({
      number: step.number,
      step: step.step,
      ingredients: step.ingredients?.map((ing: any) => ing.name) || [],
      equipment: step.equipment?.map((eq: any) => eq.name) || []
    })) || [];

    // Extraire les tags
    const tags = [
      ...(recipe.cuisines || []),
      ...(recipe.dishTypes || [])
    ].map(tag => tag.toLowerCase());

    // Insérer la recette brute
    const { error } = await supabase
      .from('recipes_raw')
      .insert({
        scraping_session_id: sessionId,
        external_id: recipe.id.toString(),
        title: recipe.title,
        description: this.cleanHtml(recipe.summary),
        ingredients,
        instructions,
        cook_time: recipe.readyInMinutes,
        servings: recipe.servings,
        cuisine_type: recipe.cuisines?.[0]?.toLowerCase(),
        tags,
        nutrition: recipe.nutrition || {},
        image_url: recipe.image,
        source_url: recipe.sourceUrl,
        hash,
        status: 'pending'
      });

    if (error) {
      throw new Error(`Erreur insertion DB: ${error.message}`);
    }
  }

  private cleanHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Exécution du script
if (require.main === module) {
  const scraper = new SpoonacularScraper();
  scraper.scrapeRecipes(400)
    .then(() => {
      console.log('✅ Script terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

export default SpoonacularScraper;