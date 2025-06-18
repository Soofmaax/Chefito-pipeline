import React, { useState } from 'react';
import { Play, Pause, Settings, Download, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const Scraping: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);

  const scrapingSessions = [
    {
      id: 1,
      provider: 'Spoonacular',
      startedAt: '2024-01-15T22:00:00Z',
      completedAt: '2024-01-15T22:45:00Z',
      status: 'completed',
      recipesScraped: 387,
      errorsCount: 3,
      config: { cuisine: 'italian', dishType: 'main course' }
    },
    {
      id: 2,
      provider: 'Spoonacular',
      startedAt: '2024-01-14T22:00:00Z',
      completedAt: '2024-01-14T22:38:00Z',
      status: 'completed',
      recipesScraped: 401,
      errorsCount: 1,
      config: { cuisine: 'french', dishType: 'dessert' }
    },
    {
      id: 3,
      provider: 'Spoonacular',
      startedAt: '2024-01-13T22:00:00Z',
      completedAt: null,
      status: 'failed',
      recipesScraped: 156,
      errorsCount: 45,
      config: { cuisine: 'mexican', dishType: 'appetizer' }
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-success-500" />;
      case 'running':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="badge badge-success">Terminé</span>;
      case 'running':
        return <span className="badge badge-info">En cours</span>;
      case 'failed':
        return <span className="badge badge-error">Échoué</span>;
      default:
        return <span className="badge badge-warning">Inconnu</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const calculateDuration = (start: string, end: string | null) => {
    if (!end) return 'En cours...';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    return `${minutes} min`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scraping automatique</h1>
          <p className="text-gray-600 mt-1">Collecte quotidienne de recettes via Spoonacular API</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button className="btn-secondary flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Configuration</span>
          </button>
          <button 
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              isRunning 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-success-600 hover:bg-success-700 text-white'
            }`}
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{isRunning ? 'Arrêter' : 'Lancer'} scraping</span>
          </button>
        </div>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Prochaine session</p>
              <p className="text-2xl font-bold text-gray-900">22:00</p>
              <p className="text-sm text-gray-500">Dans 6h 23min</p>
            </div>
            <Clock className="h-8 w-8 text-primary-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Quota Spoonacular</p>
              <p className="text-2xl font-bold text-gray-900">8,743</p>
              <p className="text-sm text-gray-500">/ 10,000 ce mois</p>
            </div>
            <div className="w-full max-w-16">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '87%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taux de succès</p>
              <p className="text-2xl font-bold text-gray-900">96.2%</p>
              <p className="text-sm text-success-600">+2.1% vs hier</p>
            </div>
            <CheckCircle className="h-8 w-8 text-success-600" />
          </div>
        </div>
      </div>

      {/* Configuration actuelle */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration actuelle</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recettes/jour</label>
            <input type="number" className="input" value="400" readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Heure d'exécution</label>
            <input type="time" className="input" value="22:00" readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Types de cuisine</label>
            <select className="input" disabled>
              <option>Rotation automatique</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Délai entre requêtes</label>
            <input type="text" className="input" value="1000ms" readOnly />
          </div>
        </div>
      </div>

      {/* Historique des sessions */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Historique des sessions</h3>
          <button className="btn-secondary flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Exporter logs</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Début
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recettes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Erreurs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Configuration
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scrapingSessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(session.status)}
                      {getStatusBadge(session.status)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(session.startedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {calculateDuration(session.startedAt, session.completedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{session.recipesScraped}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      session.errorsCount > 10 ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {session.errorsCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {session.config.cuisine} • {session.config.dishType}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructions de déploiement */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Instructions de déploiement</h4>
            <div className="mt-2 text-sm text-blue-800">
              <p className="mb-2">Pour activer le scraping automatique sur votre VPS :</p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Copiez le script <code>spoonacular-scraper.ts</code> sur votre VPS</li>
                <li>Configurez les variables d'environnement (PostgreSQL + Spoonacular)</li>
                <li>Ajoutez le cron job : <code>0 22 * * * node spoonacular-scraper.js</code></li>
                <li>Testez avec : <code>node spoonacular-scraper.js</code></li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scraping;