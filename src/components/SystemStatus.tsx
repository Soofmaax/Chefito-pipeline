import React from 'react';
import { CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react';

const SystemStatus: React.FC = () => {
  const services = [
    {
      name: 'Scraping Spoonacular',
      status: 'active',
      lastRun: '2 min ago',
      nextRun: 'Dans 22h 58min',
      description: 'Récupération automatique des recettes'
    },
    {
      name: 'Correction IA',
      status: 'active',
      lastRun: '15 min ago',
      nextRun: 'En continu',
      description: 'Nettoyage et structuration des données'
    },
    {
      name: 'Génération Audio',
      status: 'warning',
      lastRun: '1h ago',
      nextRun: 'En attente',
      description: 'ElevenLabs quota atteint, fallback gTTS'
    },
    {
      name: 'Base de données',
      status: 'active',
      lastRun: 'Temps réel',
      nextRun: '-',
      description: 'PostgreSQL opérationnel'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-success-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success">Actif</span>;
      case 'warning':
        return <span className="badge badge-warning">Attention</span>;
      default:
        return <span className="badge badge-error">Arrêté</span>;
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">État du système</h3>
        <div className="flex items-center space-x-2">
          <Zap className="h-4 w-4 text-success-500" />
          <span className="text-sm text-success-600 font-medium">Tout fonctionne</span>
        </div>
      </div>

      <div className="space-y-4">
        {services.map((service, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(service.status)}
              <div>
                <h4 className="font-medium text-gray-900">{service.name}</h4>
                <p className="text-sm text-gray-600">{service.description}</p>
              </div>
            </div>
            <div className="text-right">
              {getStatusBadge(service.status)}
              <div className="text-xs text-gray-500 mt-1">
                <div>Dernière exécution: {service.lastRun}</div>
                <div>Prochaine: {service.nextRun}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemStatus;