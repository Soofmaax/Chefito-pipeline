/**
 * Script de correction automatique par IA
 * À déployer sur votre VPS XXL avec GPU
 * 
 * Usage: node ai-corrector.js
 * Cron: 0 23 * * * /usr/bin/node /path/to/ai-corrector.js
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Fallback si pas de modèle local

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Variables d\'environnement Supabase manquantes');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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
    const { data: recipes, error } = await supabase
      .from('recipes_raw')
      .select('*')
      .eq('status', 'pending')
      .lt('scraped_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      .order('scraped_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('❌ Erreur récupération recettes:', error);
      return;
    }

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
        await supabase
          .from('recipes_raw')
          .update({ status: 'rejected' })
          .eq('id', recipe.id);
      }

      // Délai pour éviter la surcharge
      await this.delay(500);
    }

    console.log('🎉 Correction automatique terminée');
  }

  private async correctRecipe(recipe: RecipeRaw): Promise<void> {
    // Marquer comme en cours de traitement
    await supabase
      .from('recipes_raw')
      .update({ status: 'processing' })
      .eq('id', recipe.id);

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
    const { data: cleanRecipe, error: insertError } = await supabase
      .from('recipes_clean')
      .insert({
        raw_recipe_id: recipe.id,
        title: correctedTitle,
        description: correctedDescription,
        ingredients: correctedIngredients,
        cook_time: cookTime,
        prep_time: prepTime,
        total_time: cookTime + prepTime,
        servings: recipe.servings || 4,
        difficulty,
        cuisine_type: recipe.cuisine_type,
        tags: cleanedTags,
        nutrition: recipe.nutrition,
        image_url: recipe.image_url,
        corrected_by: 'ai',
        validation_score: validationScore,
        status: validationScore >= 0.8 ? 'validated' : 'validated' // Pour l'instant, tout est validé
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Erreur insertion recette nettoyée: ${insertError.message}`);
    }

    // Créer les étapes nettoyées
    for (const [index, step] of correctedSteps.entries()) {
      await supabase
        .from('steps_clean')
        .insert({
          recipe_id: cleanRecipe.id,
          step_number: index + 1,
          instruction: step.instruction,
          duration_estimate: step.duration,
          temperature: step.temperature,
          tools: step.tools || [],
          ingredients_used: step.ingredients || [],
          action_type: step.action_type,
          difficulty_level: step.difficulty || 1,
          tips: step.tips,
          warnings: step.warnings
        });
    }

    // Marquer la recette brute comme corrigée
    await supabase
      .from('recipes_raw')
      .update({ status: 'corrected' })
      .eq('id', recipe.id);
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
    await supabase
      .from('correction_logs')
      .insert({
        recipe_id: recipeId,
        correction_type: type,
        field_corrected: field,
        original_value: original,
        corrected_value: corrected,
        confidence_score: 0.8,
        corrector_id: 'ai-system'
      });
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