import React, { useState } from 'react';
import { Volume2, Play, Pause, Download, Zap, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const Audio: React.FC = () => {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const audioStats = {
    totalGenerated: 892,
    generatedToday: 156,
    elevenLabsUsed: 234,
    gttsUsed: 658,
    averageDuration: 12.5,
    totalDuration: 185.3
  };

  const recentAudio = [
    {
      id: 1,
      instruction: 'Faire chauffer l\'huile d\'olive dans une grande poêle à feu moyen',
      hash: 'a1b2c3d4e5f6',
      provider: 'elevenlabs',
      duration: 8.5,
      quality: 'high',
      status: 'ready',
      generatedAt: '2024-01-15T14:30:00Z',
      recipeTitle: 'Pasta Carbonara Authentique'
    },
    {
      id: 2,
      instruction: 'Mélanger délicatement les œufs battus avec le fromage râpé',
      hash: 'b2c3d4e5f6g7',
      provider: 'elevenlabs',
      duration: 10.2,
      quality: 'high',
      status: 'ready',
      generatedAt: '2024-01-15T14:28:00Z',
      recipeTitle: 'Pasta Carbonara Authentique'
    },
    {
      id: 3,
      instruction: 'Couper les légumes en dés de taille uniforme',
      hash: 'c3d4e5f6g7h8',
      provider: 'gtts',
      duration: 6.8,
      quality: 'standard',
      status: 'ready',
      generatedAt: '2024-01-15T14:25:00Z',
      recipeTitle: 'Ratatouille Provençale'
    },
    {
      id: 4,
      instruction: 'Préchauffer le four à 180°C (thermostat 6)',
      hash: 'd4e5f6g7h8i9',
      provider: 'gtts',
      duration: 5.5,
      quality: 'standard',
      status: 'ready',
      generatedAt: '2024-01-15T14:20:00Z',
      recipeTitle: 'Tarte aux Pommes Maison'
    },
    {
      id: 5,
      instruction: 'Laisser mijoter à feu doux pendant 25 minutes en remuant occasionnellement',
      hash: 'e5f6g7h8i9j0',
      provider: 'elevenlabs',
      duration: 14.3,
      quality: 'high',
      status: 'generating',
      generatedAt: '2024-01-15T14:35:00Z',
      recipeTitle: 'Bœuf Bourguignon'
    }
  ];

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'elevenlabs':
        return <span className="badge badge-success">ElevenLabs</span>;
      case 'gtts':
        return <span className="badge badge-info">gTTS</span>;
      default:
        return <span className="badge badge-warning">Local</span>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-success-500" />;
      case 'generating':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const handlePlayAudio = (audioId: string) => {
    if (playingAudio === audioId) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(audioId);
      // Simuler l'arrêt après la durée
      setTimeout(() => setPlayingAudio(null), 3000);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Génération audio</h1>
          <p className="text-gray-600 mt-1">Synthèse vocale automatique des étapes de recettes</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button className="btn-primary flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Générer audio manquant</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total générés</p>
              <p className="text-xl font-bold text-gray-900">{audioStats.totalGenerated}</p>
            </div>
            <Volume2 className="h-6 w-6 text-primary-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aujourd'hui</p>
              <p className="text-xl font-bold text-gray-900">{audioStats.generatedToday}</p>
            </div>
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ElevenLabs</p>
              <p className="text-xl font-bold text-gray-900">{audioStats.elevenLabsUsed}</p>
            </div>
            <Zap className="h-6 w-6 text-success-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">gTTS</p>
              <p className="text-xl font-bold text-gray-900">{audioStats.gttsUsed}</p>
            </div>
            <Volume2 className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Durée moy.</p>
              <p className="text-xl font-bold text-gray-900">{audioStats.averageDuration}s</p>
            </div>
            <Clock className="h-6 w-6 text-purple-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900">{audioStats.totalDuration}h</p>
            </div>
            <CheckCircle className="h-6 w-6 text-success-600" />
          </div>
        </div>
      </div>

      {/* Quota ElevenLabs */}
      <div className="card bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Quota ElevenLabs</h3>
            <p className="text-sm text-gray-600">Utilisation ce mois-ci</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">7,234 / 10,000</p>
            <p className="text-sm text-gray-600">caractères</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '72%' }}></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>72% utilisé</span>
            <span>2,766 restants</span>
          </div>
        </div>
      </div>

      {/* Liste des audios récents */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Audios récents</h3>
          <button className="btn-secondary flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Exporter liste</span>
          </button>
        </div>

        <div className="space-y-4">
          {recentAudio.map((audio) => (
            <div key={audio.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start space-x-4">
                {/* Contrôles audio */}
                <div className="flex-shrink-0">
                  {audio.status === 'ready' ? (
                    <button
                      className="play-button w-10 h-10"
                      onClick={() => handlePlayAudio(audio.id.toString())}
                    >
                      {playingAudio === audio.id.toString() ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </button>
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      {getStatusIcon(audio.status)}
                    </div>
                  )}
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {audio.instruction}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">
                        Recette: {audio.recipeTitle}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Hash: {audio.hash}</span>
                        <span>Durée: {formatDuration(audio.duration)}</span>
                        <span>Généré: {new Date(audio.generatedAt).toLocaleString('fr-FR')}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {getProviderBadge(audio.provider)}
                      <span className={`badge text-xs ${
                        audio.quality === 'high' ? 'badge-success' : 'badge-info'
                      }`}>
                        {audio.quality === 'high' ? 'Haute' : 'Standard'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Barre de progression pour les audios en cours */}
              {audio.status === 'generating' && (
                <div className="mt-3">
                  <div className="progress-bar">
                    <div className="progress-fill animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Génération en cours...</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Instructions de déploiement */}
      <div className="card bg-green-50 border-green-200">
        <div className="flex items-start space-x-3">
          <Volume2 className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-green-900">Configuration audio</h4>
            <div className="mt-2 text-sm text-green-800">
              <p className="mb-2">Le système audio utilise une stratégie intelligente :</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Hash unique</strong> : Évite la génération de doublons</li>
                <li><strong>ElevenLabs prioritaire</strong> : Haute qualité quand quota disponible</li>
                <li><strong>Fallback gTTS</strong> : Qualité standard si quota dépassé</li>
                <li><strong>Stockage optimisé</strong> : Cloudflare R2 pour la performance</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Audio;