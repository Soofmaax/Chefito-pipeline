import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Clock, Users, ChefHat, Volume2, Edit, CheckCircle } from 'lucide-react';

const RecipeDetail: React.FC = () => {
  const { id } = useParams();
  const [playingStep, setPlayingStep] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Mock data - en production, récupéré via l'API
  const recipe = {
    id: 1,
    title: 'Pasta Carbonara Authentique',
    description: 'Une recette traditionnelle italienne de pâtes à la carbonara, crémeuse et savoureuse, préparée avec des œufs, du fromage pecorino et de la pancetta.',
    image: 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=800',
    cookTime: 25,
    prepTime: 15,
    totalTime: 40,
    servings: 4,
    difficulty: 'moyen',
    cuisine: 'italien',
    tags: ['italien', 'pâtes', 'rapide', 'traditionnel'],
    nutrition: {
      calories: 520,
      protein: 22,
      carbs: 45,
      fat: 28
    },
    ingredients: [
      { name: 'Spaghetti', amount: 400, unit: 'g', preparation: null },
      { name: 'Pancetta', amount: 150, unit: 'g', preparation: 'coupée en dés' },
      { name: 'Œufs entiers', amount: 3, unit: 'pièces', preparation: null },
      { name: 'Jaunes d\'œufs', amount: 2, unit: 'pièces', preparation: null },
      { name: 'Pecorino Romano', amount: 100, unit: 'g', preparation: 'râpé finement' },
      { name: 'Poivre noir', amount: 1, unit: 'cuillère à café', preparation: 'fraîchement moulu' },
      { name: 'Sel', amount: 1, unit: 'pincée', preparation: 'pour l\'eau de cuisson' }
    ],
    steps: [
      {
        id: 1,
        number: 1,
        instruction: 'Porter une grande casserole d\'eau salée à ébullition pour les pâtes',
        duration: 5,
        tools: ['casserole', 'cuillère en bois'],
        tips: 'L\'eau doit être bien salée, comme l\'eau de mer',
        audioUrl: '/audio/step1.mp3',
        audioGenerated: true
      },
      {
        id: 2,
        number: 2,
        instruction: 'Dans un bol, battre les œufs entiers avec les jaunes et mélanger avec le pecorino râpé',
        duration: 3,
        tools: ['bol', 'fouet'],
        tips: 'Le mélange doit être homogène et crémeux',
        audioUrl: '/audio/step2.mp3',
        audioGenerated: true
      },
      {
        id: 3,
        number: 3,
        instruction: 'Faire revenir la pancetta dans une grande poêle à feu moyen jusqu\'à ce qu\'elle soit dorée et croustillante',
        duration: 8,
        tools: ['poêle', 'spatule'],
        tips: 'Ne pas ajouter d\'huile, la pancetta va rendre sa graisse',
        warnings: 'Attention aux projections de graisse',
        audioUrl: '/audio/step3.mp3',
        audioGenerated: true
      },
      {
        id: 4,
        number: 4,
        instruction: 'Cuire les spaghetti selon les instructions du paquet jusqu\'à ce qu\'ils soient al dente',
        duration: 10,
        tools: ['casserole', 'passoire'],
        tips: 'Goûter les pâtes 1 minute avant le temps indiqué',
        audioUrl: '/audio/step4.mp3',
        audioGenerated: true
      },
      {
        id: 5,
        number: 5,
        instruction: 'Réserver une tasse d\'eau de cuisson des pâtes, puis égoutter les spaghetti',
        duration: 2,
        tools: ['tasse', 'passoire'],
        tips: 'L\'eau de cuisson aidera à créer la sauce crémeuse',
        audioUrl: '/audio/step5.mp3',
        audioGenerated: true
      },
      {
        id: 6,
        number: 6,
        instruction: 'Ajouter les pâtes chaudes dans la poêle avec la pancetta et mélanger rapidement',
        duration: 2,
        tools: ['poêle', 'pinces'],
        tips: 'Travailler rapidement pour que les pâtes restent chaudes',
        audioUrl: '/audio/step6.mp3',
        audioGenerated: true
      },
      {
        id: 7,
        number: 7,
        instruction: 'Retirer du feu et ajouter le mélange œufs-fromage en remuant vigoureusement',
        duration: 3,
        tools: ['pinces'],
        tips: 'Le mouvement constant évite que les œufs cuisent',
        warnings: 'Ne pas remettre sur le feu pour éviter de faire brouiller les œufs',
        audioUrl: '/audio/step7.mp3',
        audioGenerated: true
      },
      {
        id: 8,
        number: 8,
        instruction: 'Ajouter l\'eau de cuisson petit à petit jusqu\'à obtenir une sauce crémeuse et onctueuse',
        duration: 2,
        tools: ['pinces'],
        tips: 'Ajouter l\'eau progressivement pour contrôler la consistance',
        audioUrl: '/audio/step8.mp3',
        audioGenerated: true
      },
      {
        id: 9,
        number: 9,
        instruction: 'Assaisonner généreusement avec le poivre noir fraîchement moulu et servir immédiatement',
        duration: 1,
        tools: ['moulin à poivre', 'assiettes'],
        tips: 'Servir dans des assiettes chaudes pour maintenir la température',
        audioUrl: '/audio/step9.mp3',
        audioGenerated: true
      }
    ],
    status: 'validated',
    correctedBy: 'ai',
    validationScore: 0.95,
    createdAt: '2024-01-15T11:15:00Z'
  };

  const handlePlayAudio = (stepNumber: number) => {
    if (playingStep === stepNumber) {
      setPlayingStep(null);
    } else {
      setPlayingStep(stepNumber);
      // Simuler l'arrêt après la durée
      setTimeout(() => setPlayingStep(null), 3000);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facile': return 'text-success-600 bg-success-100';
      case 'moyen': return 'text-yellow-600 bg-yellow-100';
      case 'difficile': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Navigation */}
      <div className="flex items-center space-x-4">
        <Link to="/recipes" className="flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux recettes
        </Link>
      </div>

      {/* Header de la recette */}
      <div className="card">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <img
              src={recipe.image}
              alt={recipe.title}
              className="w-full h-64 lg:h-80 object-cover rounded-lg"
            />
          </div>
          
          <div>
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{recipe.title}</h1>
              <button className="btn-secondary">
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">{recipe.description}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Temps total</p>
                  <p className="font-semibold">{recipe.totalTime} min</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Portions</p>
                  <p className="font-semibold">{recipe.servings} personnes</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <ChefHat className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Difficulté</p>
                  <span className={`badge ${getDifficultyColor(recipe.difficulty)}`}>
                    {recipe.difficulty}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-success-500" />
                <div>
                  <p className="text-sm text-gray-600">Statut</p>
                  <span className="badge badge-success">Validée</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map((tag, index) => (
                <span key={index} className="badge badge-info">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingrédients */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingrédients</h3>
          <div className="space-y-3">
            {recipe.ingredients.map((ingredient, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">{ingredient.name}</p>
                  {ingredient.preparation && (
                    <p className="text-sm text-gray-600">{ingredient.preparation}</p>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {ingredient.amount} {ingredient.unit}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Instructions</h3>
              <div className="flex items-center space-x-2">
                <Volume2 className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Audio disponible</span>
              </div>
            </div>
            
            <div className="space-y-6">
              {recipe.steps.map((step, index) => (
                <div key={step.id} className={`border rounded-lg p-4 transition-all duration-200 ${
                  currentStep === index ? 'border-primary-300 bg-primary-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        currentStep === index 
                          ? 'bg-primary-600 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {step.number}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-gray-900 mb-3">{step.instruction}</p>
                      
                      {step.tips && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                          <p className="text-sm text-blue-800">
                            <strong>💡 Conseil :</strong> {step.tips}
                          </p>
                        </div>
                      )}
                      
                      {step.warnings && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                          <p className="text-sm text-yellow-800">
                            <strong>⚠️ Attention :</strong> {step.warnings}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>⏱️ {step.duration} min</span>
                          {step.tools.length > 0 && (
                            <span>🔧 {step.tools.join(', ')}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {step.audioGenerated && (
                            <button
                              className="flex items-center space-x-1 text-primary-600 hover:text-primary-700"
                              onClick={() => handlePlayAudio(step.number)}
                            >
                              {playingStep === step.number ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                              <span className="text-sm">Audio</span>
                            </button>
                          )}
                          
                          <button
                            className={`btn-secondary text-sm ${
                              currentStep === index ? 'bg-primary-600 text-white' : ''
                            }`}
                            onClick={() => setCurrentStep(index)}
                          >
                            {currentStep === index ? 'En cours' : 'Sélectionner'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Informations nutritionnelles */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations nutritionnelles (par portion)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-600">{recipe.nutrition.calories}</p>
            <p className="text-sm text-gray-600">Calories</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{recipe.nutrition.protein}g</p>
            <p className="text-sm text-gray-600">Protéines</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{recipe.nutrition.carbs}g</p>
            <p className="text-sm text-gray-600">Glucides</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{recipe.nutrition.fat}g</p>
            <p className="text-sm text-gray-600">Lipides</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;