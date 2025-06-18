/**
 * Script de scraping Spoonacular
 * À déployer sur votre VPS avec cron job quotidien
 * 
 * Usage: node spoonacular-scraper.js
 * Cron: 0 22 * * * /usr/bin/node /path/to/spoonacular-scraper.js
 */

import { Pool } from 'pg';
import crypto from 'crypto';

// Configuration
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!SPOONACULAR_API_KEY || !DATABASE_URL) {
  throw new Error('Variables d\'environnement manquantes');
}

const pool = new Pool({ connectionString: DATABASE_URL });

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
    const { rows: sessionRows } = await pool.query(
      'INSERT INTO scraping_sessions(provider, status, config) VALUES($1,$2,$3) RETURNING *',
      ['spoonacular', 'running', { target_count: targetCount }]
    );
    const session = sessionRows[0];
    if (!session) {
      console.error('❌ Erreur création session');
      return;
    }

    let scrapedCount = 0;
    let errorCount = 0;
    const cuisineTypes = ['italian', 'french', 'mexican', 'asian', 'american', 'mediterranean'];
    const dishTypes = ['main course', 'dessert', 'appetizer', 'soup', 'salad'];

    try {
      for (let offset = 0; scrapedCount < targetCount && scrapedCount < this.dailyQuota; offset += 20) {
        // Rotation des types de cuisine et plats
        const cuisine = cuisineTypes[Math.floor(Math.random() * cuisineTypes.length)];
        const dishType = dishTypes[Math.floor(Math.random() * dishTypes.length)];

        try {
          const recipes = await this.fetchRecipeBatch(offset, cuisine, dishType);
          
          for (const recipe of recipes) {
            if (scrapedCount >= targetCount || scrapedCount >= this.dailyQuota) break;

            try {
              await this.processRecipe(recipe, session.id);
              scrapedCount++;
              if (scrapedCount >= this.dailyQuota) break;
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
      await pool.query(
        `UPDATE scraping_sessions
         SET status='completed', completed_at=NOW(),
             recipes_scraped=$1, errors_count=$2
         WHERE id=$3`,
        [scrapedCount, errorCount, session.id]
      );

      console.log(`🎉 Scraping terminé: ${scrapedCount} recettes, ${errorCount} erreurs`);

    } catch (error) {
      console.error('❌ Erreur fatale:', error);
      
      await pool.query(
        `UPDATE scraping_sessions
         SET status='failed', completed_at=NOW(),
             recipes_scraped=$1, errors_count=$2
         WHERE id=$3`,
        [scrapedCount, errorCount, session.id]
      );
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
    const { rows: existing } = await pool.query(
      'SELECT id FROM recipes_raw WHERE hash=$1 LIMIT 1',
      [hash]
    );

    if (existing.length) {
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
    await pool.query(
      `INSERT INTO recipes_raw (
        scraping_session_id, external_id, title, description,
        ingredients, instructions, cook_time, servings, cuisine_type,
        tags, nutrition, image_url, source_url, hash, status
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'pending'
      )`,
      [
        sessionId,
        recipe.id.toString(),
        recipe.title,
        this.cleanHtml(recipe.summary),
        JSON.stringify(ingredients),
        JSON.stringify(instructions),
        recipe.readyInMinutes,
        recipe.servings,
        recipe.cuisines?.[0]?.toLowerCase(),
        tags,
        recipe.nutrition || {},
        recipe.image,
        recipe.sourceUrl,
        hash
      ]
    );
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
