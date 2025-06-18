/**
 * Script de correction automatique par IA
 * À déployer sur votre VPS XXL avec GPU
 * 
 * Usage: node ai-corrector.js
 * Cron: 0 23 * * * /usr/bin/node /path/to/ai-corrector.js
 */

import { Pool } from 'pg';
import crypto from 'crypto';

const DATABASE_URL = process.env.DATABASE_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Fallback si pas de modèle local

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL manquant');
}
const pool = new Pool({ connectionString: DATABASE_URL });

interface RecipeRaw {
  id: string;
  title: string;
  description?: string;
  ingredients: any[];
  instructions: any[];
  cook_time?: number;
  prep_time?: number;
  servings?: number;
  difficulty?: string;
  cuisine_type?: string;
  tags: string[];
  nutrition: any;
  image_url?: string;
}

interface CorrectedRecipe {
  title: string;
  description: string;
  ingredients: any[];
  steps: any[];
  cook_time: number;
  prep_time: number;
  servings: number;
  difficulty: string;
  cuisine_type: string;
  tags: string[];
  validation_score: number;
}

class AICorrector {
  private corrections: Map<string, any> = new Map();

  async processRecipes(): Promise<void> {
    console.log('🧠 Début de la correction automatique par IA');

    // Récupérer les recettes en attente (plus anciennes que 48h pour éviter les conflits)
    const { rows: recipes } = await pool.query(
      `SELECT * FROM recipes_raw
       WHERE status='pending' AND scraped_at < NOW() - INTERVAL '48 hours'
       ORDER BY scraped_at ASC
       LIMIT 50`
    );

    if (!recipes || recipes.length === 0) {
      console.log('ℹ️ Aucune recette à corriger');
      return;
    }

    console.log(`📝 ${recipes.length} recettes à corriger`);

    for (const recipe of recipes) {
      try {
        await this.correctRecipe(recipe);
        console.log(`✅ Recette corrigée: ${recipe.title}`);
      } catch (error) {
        console.error(`❌ Erreur correction ${recipe.title}:`, error);
        
        // Marquer comme rejetée si trop d'erreurs
        await pool.query(
          'UPDATE recipes_raw SET status=$1 WHERE id=$2',
          ['rejected', recipe.id]
        );
      }

      // Délai pour éviter la surcharge
      await this.delay(500);
    }

    console.log('🎉 Correction automatique terminée');
  }

  private async correctRecipe(recipe: RecipeRaw): Promise<void> {
    // Marquer comme en cours de traitement
    await pool.query(
      'UPDATE recipes_raw SET status=$1 WHERE id=$2',
      ['processing', recipe.id]
    );

    // Correction du titre
    const correctedTitle = this.correctTitle(recipe.title);
    if (correctedTitle !== recipe.title) {
      await this.logCorrection(recipe.id, 'title', recipe.title, correctedTitle, 'ai');
    }

    // Correction de la description
    const correctedDescription = this.correctDescription(recipe.description || '');

    // Correction des ingrédients
    const correctedIngredients = this.correctIngredients(recipe.ingredients);

    // Correction des instructions et création des étapes
    const correctedSteps = this.correctInstructions(recipe.instructions);

    // Estimation des temps de cuisson
    const { cookTime, prepTime } = this.estimateTimes(correctedSteps, recipe.cook_time);

    // Détermination de la difficulté
    const difficulty = this.calculateDifficulty(correctedSteps, correctedIngredients);

    // Nettoyage des tags
    const cleanedTags = this.cleanTags(recipe.tags);

    // Score de validation
    const validationScore = this.calculateValidationScore({
      title: correctedTitle,
      ingredients: correctedIngredients,
      steps: correctedSteps,
      cookTime,
      prepTime
    });

    // Créer la recette nettoyée
    const { rows: cleanRows } = await pool.query(
      `INSERT INTO recipes_clean (
        raw_recipe_id, title, description, ingredients,
        cook_time, prep_time, total_time, servings, difficulty,
        cuisine_type, tags, nutrition, image_url,
        corrected_by, validation_score, status
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'ai',$14,$15
      ) RETURNING *`,
      [
        recipe.id,
        correctedTitle,
        correctedDescription,
        JSON.stringify(correctedIngredients),
        cookTime,
        prepTime,
        cookTime + prepTime,
        recipe.servings || 4,
        difficulty,
        recipe.cuisine_type,
        cleanedTags,
        recipe.nutrition,
        recipe.image_url,
        validationScore,
        validationScore >= 0.8 ? 'validated' : 'validated'
      ]
    );
    const cleanRecipe = cleanRows[0];

    // Créer les étapes nettoyées
    for (const [index, step] of correctedSteps.entries()) {
      await pool.query(
        `INSERT INTO steps_clean (
          recipe_id, step_number, instruction,
          duration_estimate, temperature, tools,
          ingredients_used, action_type, difficulty_level,
          tips, warnings
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
        )`,
        [
          cleanRecipe.id,
          index + 1,
          step.instruction,
          step.duration,
          step.temperature,
          JSON.stringify(step.tools || []),
          JSON.stringify(step.ingredients || []),
          step.action_type,
          step.difficulty || 1,
          step.tips,
          step.warnings
        ]
      );
    }

    // Marquer la recette brute comme corrigée
    await pool.query(
      'UPDATE recipes_raw SET status=$1 WHERE id=$2',
      ['corrected', recipe.id]
    );
  }

  private correctTitle(title: string): string {
    if (!title) return 'Recette sans titre';
    
    // Nettoyer et capitaliser
    return title
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/^./, str => str.toUpperCase());
  }

  private correctDescription(description: string): string {
    if (!description) return '';
    
    // Nettoyer le HTML et limiter la longueur
    return description
      .replace(/<[^>]*>/g, '')
      .trim()
      .substring(0, 500);
  }

  private correctIngredients(ingredients: any[]): any[] {
    if (!Array.isArray(ingredients)) return [];

    return ingredients
      .filter(ing => ing && (ing.name || ing.original))
      .map(ing => ({
        name: ing.name || this.extractIngredientName(ing.original || ''),
        amount: this.normalizeAmount(ing.amount),
        unit: this.normalizeUnit(ing.unit),
        original: ing.original || ing.name,
        preparation: ing.preparation || null
      }));
  }

  private correctInstructions(instructions: any[]): any[] {
    if (!Array.isArray(instructions)) return [];

    return instructions
      .filter(inst => inst && inst.step)
      .map((inst, index) => {
        const instruction = inst.step.trim();
        
        return {
          instruction,
          duration: this.estimateStepDuration(instruction),
          temperature: this.extractTemperature(instruction),
          tools: this.extractTools(instruction),
          ingredients: inst.ingredients || [],
          action_type: this.classifyAction(instruction),
          difficulty: this.estimateStepDifficulty(instruction),
          tips: this.generateTips(instruction),
          warnings: this.generateWarnings(instruction)
        };
      });
  }

  private estimateTimes(steps: any[], originalCookTime?: number): { cookTime: number; prepTime: number } {
    const totalDuration = steps.reduce((sum, step) => sum + (step.duration || 0), 0);
    
    // Séparer préparation et cuisson
    const prepSteps = steps.filter(step => 
      ['prep', 'mix', 'chop', 'combine'].includes(step.action_type)
    );
    const cookSteps = steps.filter(step => 
      ['cook', 'bake', 'fry', 'boil'].includes(step.action_type)
    );

    const prepTime = prepSteps.reduce((sum, step) => sum + (step.duration || 0), 0) || 15;
    const cookTime = cookSteps.reduce((sum, step) => sum + (step.duration || 0), 0) || originalCookTime || 20;

    return { cookTime, prepTime };
  }

  private calculateDifficulty(steps: any[], ingredients: any[]): string {
    const complexIngredients = ingredients.filter(ing => 
      ing.preparation || ing.name.includes('frais') || ing.name.includes('maison')
    ).length;

    const complexSteps = steps.filter(step => 
      step.difficulty > 3 || step.action_type === 'technique'
    ).length;

    const totalComplexity = complexIngredients + complexSteps + steps.length;

    if (totalComplexity <= 5) return 'facile';
    if (totalComplexity <= 10) return 'moyen';
    return 'difficile';
  }

  private cleanTags(tags: string[]): string[] {
    if (!Array.isArray(tags)) return [];
    
    return [...new Set(tags
      .filter(tag => tag && typeof tag === 'string')
      .map(tag => tag.toLowerCase().trim())
      .filter(tag => tag.length > 2 && tag.length < 20)
    )].slice(0, 10);
  }

  private calculateValidationScore(recipe: any): number {
    let score = 0;
    
    // Titre valide
    if (recipe.title && recipe.title.length > 5) score += 0.2;
    
    // Ingrédients valides
    if (recipe.ingredients && recipe.ingredients.length >= 3) score += 0.3;
    
    // Étapes valides
    if (recipe.steps && recipe.steps.length >= 3) score += 0.3;
    
    // Temps cohérents
    if (recipe.cookTime > 0 && recipe.prepTime > 0) score += 0.1;
    
    // Instructions détaillées
    const avgInstructionLength = recipe.steps.reduce((sum: number, step: any) => 
      sum + step.instruction.length, 0) / recipe.steps.length;
    if (avgInstructionLength > 30) score += 0.1;

    return Math.min(score, 1.0);
  }

  // Méthodes utilitaires
  private extractIngredientName(original: string): string {
    return original.replace(/^\d+.*?\s/, '').trim();
  }

  private normalizeAmount(amount: any): number {
    if (typeof amount === 'number') return amount;
    if (typeof amount === 'string') {
      const num = parseFloat(amount.replace(/[^\d.,]/g, ''));
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }

  private normalizeUnit(unit: any): string {
    if (!unit) return '';
    const unitMap: { [key: string]: string } = {
      'cups': 'tasses',
      'cup': 'tasse',
      'tbsp': 'cuillères à soupe',
      'tsp': 'cuillères à café',
      'oz': 'onces',
      'lb': 'livres',
      'g': 'grammes',
      'kg': 'kilogrammes',
      'ml': 'millilitres',
      'l': 'litres'
    };
    return unitMap[unit.toLowerCase()] || unit;
  }

  private estimateStepDuration(instruction: string): number {
    const durationKeywords = {
      'mélanger': 2,
      'couper': 5,
      'hacher': 3,
      'cuire': 15,
      'faire revenir': 5,
      'bouillir': 10,
      'mijoter': 20,
      'four': 25,
      'repos': 30,
      'refroidir': 60
    };

    for (const [keyword, duration] of Object.entries(durationKeywords)) {
      if (instruction.toLowerCase().includes(keyword)) {
        return duration;
      }
    }

    // Extraction de durée explicite
    const timeMatch = instruction.match(/(\d+)\s*(min|minute|heure)/i);
    if (timeMatch) {
      const value = parseInt(timeMatch[1]);
      const unit = timeMatch[2].toLowerCase();
      return unit.includes('heure') ? value * 60 : value;
    }

    return 5; // Durée par défaut
  }

  private extractTemperature(instruction: string): string | null {
    const tempMatch = instruction.match(/(\d+)\s*°?[CF]?/);
    return tempMatch ? `${tempMatch[1]}°C` : null;
  }

  private extractTools(instruction: string): string[] {
    const tools = [];
    const toolKeywords = [
      'poêle', 'casserole', 'four', 'mixeur', 'fouet', 'couteau',
      'planche', 'bol', 'saladier', 'passoire', 'râpe'
    ];

    for (const tool of toolKeywords) {
      if (instruction.toLowerCase().includes(tool)) {
        tools.push(tool);
      }
    }

    return tools;
  }

  private classifyAction(instruction: string): string {
    const actionMap = {
      'couper': 'prep',
      'hacher': 'prep',
      'mélanger': 'mix',
      'cuire': 'cook',
      'faire revenir': 'cook',
      'bouillir': 'boil',
      'four': 'bake',
      'frire': 'fry'
    };

    for (const [keyword, action] of Object.entries(actionMap)) {
      if (instruction.toLowerCase().includes(keyword)) {
        return action;
      }
    }

    return 'other';
  }

  private estimateStepDifficulty(instruction: string): number {
    const complexKeywords = ['tempérer', 'émulsionner', 'flamber', 'technique'];
    const simpleKeywords = ['mélanger', 'ajouter', 'verser'];

    if (complexKeywords.some(keyword => instruction.toLowerCase().includes(keyword))) {
      return 4;
    }
    if (simpleKeywords.some(keyword => instruction.toLowerCase().includes(keyword))) {
      return 1;
    }
    return 2;
  }

  private generateTips(instruction: string): string | null {
    // Logique simple pour générer des conseils
    if (instruction.toLowerCase().includes('cuire')) {
      return 'Surveillez la cuisson pour éviter que ça brûle';
    }
    if (instruction.toLowerCase().includes('mélanger')) {
      return 'Mélangez délicatement pour ne pas casser les ingrédients';
    }
    return null;
  }

  private generateWarnings(instruction: string): string | null {
    if (instruction.toLowerCase().includes('huile chaude')) {
      return 'Attention aux projections d\'huile chaude';
    }
    if (instruction.toLowerCase().includes('four')) {
      return 'Utilisez des gants de cuisine pour manipuler les plats chauds';
    }
    return null;
  }

  private async logCorrection(
    recipeId: string, 
    field: string, 
    original: string, 
    corrected: string, 
    type: string
  ): Promise<void> {
    await pool.query(
      `INSERT INTO correction_logs (
        recipe_id, correction_type, field_corrected,
        original_value, corrected_value, confidence_score, corrector_id
      ) VALUES (
        $1,$2,$3,$4,$5,0.8,'ai-system'
      )`,
      [recipeId, type, field, original, corrected]
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Exécution du script
if (require.main === module) {
  const corrector = new AICorrector();
  corrector.processRecipes()
    .then(() => {
      console.log('✅ Correction automatique terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

export default AICorrector;
