import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Key, Database, Zap, Volume2, Brain, AlertTriangle } from 'lucide-react';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('apis');

  const tabs = [
    { id: 'apis', name: 'APIs & Clés', icon: Key },
    { id: 'database', name: 'Base de données', icon: Database },
    { id: 'scraping', name: 'Scraping', icon: Zap },
    { id: 'audio', name: 'Audio', icon: Volume2 },
    { id: 'ai', name: 'IA & Correction', icon: Brain }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres système</h1>
          <p className="text-gray-600 mt-1">Configuration complète de Chefito</p>
        </div>
        <button className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0">
          <Save className="h-4 w-4" />
          <span>Sauvegarder</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Navigation des onglets */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${
                    activeTab === tab.id ? 'text-primary-600' : 'text-gray-400'
                  }`} />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenu des onglets */}
        <div className="flex-1">
          {activeTab === 'apis' && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Configuration des APIs</h3>
              <div className="space-y-6">
                {/* Spoonacular */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clé API Spoonacular
                  </label>
                  <input
                    type="password"
                    className="input"
                    placeholder="your_spoonacular_api_key"
                    defaultValue="sk-..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Utilisée pour le scraping quotidien de recettes
                  </p>
                </div>

                {/* ElevenLabs */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clé API ElevenLabs
                  </label>
                  <input
                    type="password"
                    className="input"
                    placeholder="your_elevenlabs_api_key"
                    defaultValue="el_..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Génération audio haute qualité (prioritaire)
                  </p>
                </div>

                {/* Cloudflare R2 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cloudflare R2 - Access Key
                  </label>
                  <input
                    type="password"
                    className="input"
                    placeholder="your_r2_access_key"
                    defaultValue="cf_..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cloudflare R2 - Secret Key
                  </label>
                  <input
                    type="password"
                    className="input"
                    placeholder="your_r2_secret_key"
                    defaultValue="***"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bucket R2
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="chefito-audio"
                    defaultValue="chefito-audio"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Configuration base de données</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL PostgreSQL
                  </label>
                  <input
                    type="url"
                    className="input"
                    placeholder="postgres://user:password@localhost:5432/chefito"
                    defaultValue="postgres://user:password@localhost:5432/chefito"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chaîne de connexion
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="postgres://user:password@host:5432/db"
                    defaultValue="postgres://user:password@localhost:5432/chefito"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Database className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Statut de la base</h4>
                      <p className="text-sm text-blue-800 mt-1">
                        ✅ Connexion active • 9 tables • RLS activé • Migrations à jour
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scraping' && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Configuration scraping</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recettes par jour
                    </label>
                    <input
                      type="number"
                      className="input"
                      defaultValue="400"
                      min="100"
                      max="1000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Heure d'exécution
                    </label>
                    <input
                      type="time"
                      className="input"
                      defaultValue="22:00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Délai entre requêtes (ms)
                  </label>
                  <input
                    type="number"
                    className="input"
                    defaultValue="1000"
                    min="500"
                    max="5000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Augmenter si vous atteignez les limites de taux
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Types de cuisine (rotation automatique)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {['Italian', 'French', 'Mexican', 'Asian', 'American', 'Mediterranean'].map((cuisine) => (
                      <label key={cuisine} className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-sm">{cuisine}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Configuration audio</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provider prioritaire
                  </label>
                  <select className="input">
                    <option value="elevenlabs">ElevenLabs (haute qualité)</option>
                    <option value="gtts">Google TTS (standard)</option>
                    <option value="local">Synthèse locale</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voice ID ElevenLabs
                  </label>
                  <input
                    type="text"
                    className="input"
                    defaultValue={import.meta.env.VITE_ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'}
                    placeholder="Voice ID"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stabilité voix
                    </label>
                    <input
                      type="range"
                      className="w-full"
                      min="0"
                      max="1"
                      step="0.1"
                      defaultValue="0.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Similarité
                    </label>
                    <input
                      type="range"
                      className="w-full"
                      min="0"
                      max="1"
                      step="0.1"
                      defaultValue="0.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Langue
                  </label>
                  <select className="input">
                    <option value="fr">Français</option>
                    <option value="en">Anglais</option>
                    <option value="es">Espagnol</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Configuration IA</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seuil de confiance pour correction automatique
                  </label>
                  <input
                    type="range"
                    className="w-full"
                    min="0.5"
                    max="1"
                    step="0.05"
                    defaultValue="0.8"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Conservateur (0.5)</span>
                    <span>Actuel: 0.8</span>
                    <span>Agressif (1.0)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Délai avant correction automatique
                  </label>
                  <select className="input">
                    <option value="24">24 heures</option>
                    <option value="48" selected>48 heures</option>
                    <option value="72">72 heures</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Évite les conflits avec les corrections manuelles
                  </p>
                </div>

                <div>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-sm">Apprentissage continu activé</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    L'IA apprend de vos corrections manuelles
                  </p>
                </div>

                <div>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Fine-tuning automatique (expérimental)</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    Réentraînement hebdomadaire du modèle local
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-900">Modèle local</h4>
                      <p className="text-sm text-yellow-800 mt-1">
                        Le fine-tuning local nécessite un VPS avec GPU (recommandé: RTX 4090 ou équivalent)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
