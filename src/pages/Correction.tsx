import React, { useState } from 'react';
import { Edit3, Check, X, Brain, User, BarChart3, AlertTriangle } from 'lucide-react';

const Correction: React.FC = () => {
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [correctionMode, setCorrectionMode] = useState<'manual' | 'ai'>('manual');

  const pendingRecipes = [
    {
      id: 1,
      title: 'pasta carbonara with eggs and bacon',
      description: 'A classic Italian dish made with pasta, eggs, cheese, and bacon. Very delicious and easy to make.',
      ingredients: [
        { name: 'pasta', amount: 1, unit: 'lb', original: '1 lb pasta' },
        { name: 'bacon', amount: 6, unit: 'slices', original: '6 slices bacon' },
        { name: 'eggs', amount: 3, unit: '', original: '3 large eggs' }
      ],
      instructions: [
        { step: 'Cook pasta according to package directions' },
        { step: 'Fry bacon until crispy' },
        { step: 'Mix eggs with cheese' },
        { step: 'Combine everything together' }
      ],
      scrapedAt: '2024-01-15T10:30:00Z',
      issues: ['title_case', 'vague_instructions', 'missing_details']
    },
    {
      id: 2,
      title: 'CHOCOLATE CAKE RECIPE!!!',
      description: 'Super yummy chocolate cake that everyone will love! So good!',
      ingredients: [
        { name: 'flour', amount: 2, unit: 'cups', original: '2 cups all-purpose flour' },
        { name: 'sugar', amount: 1.5, unit: 'cups', original: '1 1/2 cups sugar' }
      ],
      instructions: [
        { step: 'Mix dry ingredients' },
        { step: 'Add wet ingredients' },
        { step: 'Bake in oven' }
      ],
      scrapedAt: '2024-01-15T09:15:00Z',
      issues: ['title_formatting', 'unprofessional_tone', 'incomplete_instructions']
    }
  ];

  const correctionStats = {
    totalPending: 23,
    correctedToday: 15,
    aiAccuracy: 87.3,
    manualCorrections: 8
  };

  const getIssueColor = (issue: string) => {
    const colors: { [key: string]: string } = {
      'title_case': 'bg-yellow-100 text-yellow-800',
      'vague_instructions': 'bg-red-100 text-red-800',
      'missing_details': 'bg-orange-100 text-orange-800',
      'title_formatting': 'bg-blue-100 text-blue-800',
      'unprofessional_tone': 'bg-purple-100 text-purple-800',
      'incomplete_instructions': 'bg-red-100 text-red-800'
    };
    return colors[issue] || 'bg-gray-100 text-gray-800';
  };

  const getIssueLabel = (issue: string) => {
    const labels: { [key: string]: string } = {
      'title_case': 'Casse du titre',
      'vague_instructions': 'Instructions vagues',
      'missing_details': 'Détails manquants',
      'title_formatting': 'Format du titre',
      'unprofessional_tone': 'Ton non professionnel',
      'incomplete_instructions': 'Instructions incomplètes'
    };
    return labels[issue] || issue;
  };

  const handleCorrectRecipe = (recipe: any) => {
    setSelectedRecipe(recipe);
  };

  const handleSaveCorrection = () => {
    // Logique de sauvegarde
    setSelectedRecipe(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Correction des recettes</h1>
          <p className="text-gray-600 mt-1">Nettoyage et validation pour l'apprentissage IA</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button 
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              correctionMode === 'manual' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setCorrectionMode('manual')}
          >
            <User className="h-4 w-4 inline mr-2" />
            Manuel
          </button>
          <button 
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              correctionMode === 'ai' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setCorrectionMode('ai')}
          >
            <Brain className="h-4 w-4 inline mr-2" />
            IA
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-gray-900">{correctionStats.totalPending}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Corrigées aujourd'hui</p>
              <p className="text-2xl font-bold text-gray-900">{correctionStats.correctedToday}</p>
            </div>
            <Check className="h-8 w-8 text-success-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Précision IA</p>
              <p className="text-2xl font-bold text-gray-900">{correctionStats.aiAccuracy}%</p>
            </div>
            <Brain className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Corrections manuelles</p>
              <p className="text-2xl font-bold text-gray-900">{correctionStats.manualCorrections}</p>
            </div>
            <User className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liste des recettes à corriger */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recettes en attente</h3>
          <div className="space-y-4">
            {pendingRecipes.map((recipe) => (
              <div key={recipe.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-2">{recipe.title}</h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{recipe.description}</p>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {recipe.issues.map((issue, index) => (
                        <span key={index} className={`badge text-xs ${getIssueColor(issue)}`}>
                          {getIssueLabel(issue)}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Scrapée {new Date(recipe.scrapedAt).toLocaleDateString('fr-FR')}
                      </span>
                      <button 
                        className="btn-primary text-sm"
                        onClick={() => handleCorrectRecipe(recipe)}
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Corriger
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interface de correction */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedRecipe ? 'Correction en cours' : 'Sélectionnez une recette'}
          </h3>
          
          {selectedRecipe ? (
            <div className="space-y-4">
              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input 
                  type="text" 
                  className="input" 
                  defaultValue={selectedRecipe.title}
                  placeholder="Titre corrigé..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  className="input min-h-20"
                  defaultValue={selectedRecipe.description}
                  placeholder="Description corrigée..."
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                <div className="space-y-2">
                  {selectedRecipe.instructions.map((instruction: any, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500 w-8">{index + 1}.</span>
                      <input 
                        type="text" 
                        className="input flex-1" 
                        defaultValue={instruction.step}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <button 
                  className="btn-primary flex items-center space-x-2"
                  onClick={handleSaveCorrection}
                >
                  <Check className="h-4 w-4" />
                  <span>Sauvegarder</span>
                </button>
                <button 
                  className="btn-secondary flex items-center space-x-2"
                  onClick={() => setSelectedRecipe(null)}
                >
                  <X className="h-4 w-4" />
                  <span>Annuler</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Edit3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Sélectionnez une recette dans la liste pour commencer la correction</p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions pour l'IA */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Apprentissage IA</h4>
            <div className="mt-2 text-sm text-blue-800">
              <p className="mb-2">Vos corrections manuelles alimentent l'apprentissage de l'IA :</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Chaque correction est loggée pour créer un dataset d'entraînement</li>
                <li>L'IA apprend vos préférences de style et de format</li>
                <li>Le taux de correction automatique s'améliore progressivement</li>
                <li>Fine-tuning prévu sur modèle local (TinyLlama/Phi-2)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Correction;