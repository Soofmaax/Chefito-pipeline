import React, { useState } from 'react';
import { Search, Filter, Eye, Edit, Volume2, Clock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const Recipes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data - en production, cela viendrait de votre API
  const recipes = [
    {
      id: 1,
      title: 'Pasta Carbonara Authentique',
      status: 'validated',
      scrapedAt: '2024-01-15T10:30:00Z',
      correctedAt: '2024-01-15T11:15:00Z',
      audioGenerated: true,
      steps: 8,
      cookTime: 25,
      servings: 4,
      tags: ['italien', 'pâtes', 'rapide'],
      image: 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    {
      id: 2,
      title: 'Ratatouille Provençale',
      status: 'corrected',
      scrapedAt: '2024-01-15T09:45:00Z',
      correctedAt: '2024-01-15T10:30:00Z',
      audioGenerated: false,
      steps: 12,
      cookTime: 45,
      servings: 6,
      tags: ['français', 'légumes', 'végétarien'],
      image: 'https://images.pexels.com/photos/8477552/pexels-photo-8477552.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    {
      id: 3,
      title: 'Tacos de Poisson Grillé',
      status: 'pending',
      scrapedAt: '2024-01-15T08:20:00Z',
      correctedAt: null,
      audioGenerated: false,
      steps: 10,
      cookTime: 30,
      servings: 3,
      tags: ['mexicain', 'poisson', 'épicé'],
      image: 'https://images.pexels.com/photos/2087748/pexels-photo-2087748.jpeg?auto=compress&cs=tinysrgb&w=300'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'validated':
        return <span className="badge badge-success">Validée</span>;
      case 'corrected':
        return <span className="badge badge-warning">Corrigée</span>;
      case 'pending':
        return <span className="badge badge-error">En attente</span>;
      default:
        return <span className="badge badge-info">Inconnue</span>;
    }
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || recipe.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des recettes</h1>
        <div className="mt-4 sm:mt-0">
          <button className="btn-primary">
            Nouvelle recette manuelle
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une recette..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="corrected">Corrigées</option>
              <option value="validated">Validées</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map((recipe) => (
          <div key={recipe.id} className="card recipe-card">
            <div className="relative">
              <img
                src={recipe.image}
                alt={recipe.title}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <div className="absolute top-2 right-2">
                {getStatusBadge(recipe.status)}
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">{recipe.title}</h3>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {recipe.cookTime}min
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {recipe.servings}
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {recipe.tags.map((tag, index) => (
                <span key={index} className="badge badge-info text-xs">
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Link to={`/recipes/${recipe.id}`} className="text-primary-600 hover:text-primary-700">
                  <Eye className="h-4 w-4" />
                </Link>
                <button className="text-gray-600 hover:text-gray-700">
                  <Edit className="h-4 w-4" />
                </button>
                <button className={`${recipe.audioGenerated ? 'text-success-600' : 'text-gray-400'}`}>
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>
              <span className="text-xs text-gray-500">
                {recipe.steps} étapes
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Aucune recette trouvée avec ces critères.</p>
        </div>
      )}
    </div>
  );
};

export default Recipes;