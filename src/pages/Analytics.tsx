import React from 'react';
import { BarChart3, TrendingUp, Clock, Target, Zap, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const Analytics: React.FC = () => {
  // Données de performance quotidienne
  const dailyPerformance = [
    { date: '10/01', scraped: 387, corrected: 298, audio: 156 },
    { date: '11/01', scraped: 401, corrected: 312, audio: 189 },
    { date: '12/01', scraped: 356, corrected: 289, audio: 167 },
    { date: '13/01', scraped: 423, corrected: 334, audio: 201 },
    { date: '14/01', scraped: 398, corrected: 301, audio: 178 },
    { date: '15/01', scraped: 412, corrected: 318, audio: 195 },
    { date: '16/01', scraped: 389, corrected: 295, audio: 172 }
  ];

  // Données de précision IA
  const aiAccuracy = [
    { week: 'S1', accuracy: 72.3 },
    { week: 'S2', accuracy: 78.1 },
    { week: 'S3', accuracy: 82.5 },
    { week: 'S4', accuracy: 87.3 },
    { week: 'S5', accuracy: 89.7 },
    { week: 'S6', accuracy: 91.2 }
  ];

  // Répartition des providers audio
  const audioProviders = [
    { name: 'ElevenLabs', value: 234, color: '#22c55e' },
    { name: 'gTTS', value: 658, color: '#3b82f6' }
  ];

  // Types de corrections les plus fréquents
  const correctionTypes = [
    { type: 'Instructions vagues', count: 45 },
    { type: 'Format titre', count: 38 },
    { type: 'Détails manquants', count: 32 },
    { type: 'Ton non professionnel', count: 28 },
    { type: 'Temps incohérents', count: 23 }
  ];

  const kpis = [
    {
      title: 'Efficacité globale',
      value: '94.2%',
      change: '+2.3%',
      trend: 'up',
      icon: Target,
      color: 'text-success-600'
    },
    {
      title: 'Temps moyen/recette',
      value: '3.2min',
      change: '-0.8min',
      trend: 'down',
      icon: Clock,
      color: 'text-blue-600'
    },
    {
      title: 'Autonomie IA',
      value: '87.3%',
      change: '+12.1%',
      trend: 'up',
      icon: Zap,
      color: 'text-purple-600'
    },
    {
      title: 'Satisfaction qualité',
      value: '96.8%',
      change: '+1.2%',
      trend: 'up',
      icon: Users,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Performance</h1>
          <p className="text-gray-600 mt-1">Métriques détaillées du système Chefito</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select className="input w-48">
            <option>7 derniers jours</option>
            <option>30 derniers jours</option>
            <option>3 derniers mois</option>
          </select>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className={`h-4 w-4 mr-1 ${
                    kpi.trend === 'up' ? 'text-success-500' : 'text-red-500'
                  }`} />
                  <span className={`text-sm font-medium ${
                    kpi.trend === 'up' ? 'text-success-600' : 'text-red-600'
                  }`}>
                    {kpi.change}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-lg bg-gray-50 ${kpi.color}`}>
                <kpi.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance quotidienne */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance quotidienne</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="scraped" stroke="#f59e0b" strokeWidth={2} name="Scrapées" />
              <Line type="monotone" dataKey="corrected" stroke="#3b82f6" strokeWidth={2} name="Corrigées" />
              <Line type="monotone" dataKey="audio" stroke="#22c55e" strokeWidth={2} name="Audio" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Évolution précision IA */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution précision IA</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={aiAccuracy}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis domain={[70, 95]} />
              <Tooltip formatter={(value) => [`${value}%`, 'Précision']} />
              <Line 
                type="monotone" 
                dataKey="accuracy" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition providers audio */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Providers audio</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={audioProviders}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {audioProviders.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Fichiers']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 mt-4">
            {audioProviders.map((provider, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: provider.color }}
                ></div>
                <span className="text-sm text-gray-600">{provider.name}: {provider.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Types de corrections */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Types de corrections fréquents</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={correctionTypes} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="type" type="category" width={120} />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Métriques détaillées */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Métriques détaillées</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-600">2,847</p>
            <p className="text-sm text-gray-600 mt-1">Recettes totales</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-success-600">96.2%</p>
            <p className="text-sm text-gray-600 mt-1">Taux de succès scraping</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">4.2s</p>
            <p className="text-sm text-gray-600 mt-1">Temps moyen correction IA</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">€127</p>
            <p className="text-sm text-gray-600 mt-1">Coût mensuel APIs</p>
          </div>
        </div>
      </div>

      {/* Recommandations */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Recommandations d'optimisation</h4>
            <div className="mt-2 text-sm text-blue-800">
              <ul className="list-disc list-inside space-y-1">
                <li>La précision IA s'améliore constamment (+12% ce mois)</li>
                <li>Quota ElevenLabs bien géré avec fallback gTTS efficace</li>
                <li>Temps de traitement optimal, système très performant</li>
                <li>Envisager fine-tuning local pour réduire les coûts API</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;