import React from 'react';
import { 
  BookOpen, 
  Download, 
  Edit3, 
  Volume2, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import StatsCard from '../components/StatsCard';
import RecentActivity from '../components/RecentActivity';
import SystemStatus from '../components/SystemStatus';

const Dashboard: React.FC = () => {
  const stats = [
    {
      title: 'Recettes totales',
      value: '1,247',
      change: '+12%',
      trend: 'up' as const,
      icon: BookOpen,
      color: 'primary'
    },
    {
      title: 'Scrapées aujourd\'hui',
      value: '387',
      change: '+5%',
      trend: 'up' as const,
      icon: Download,
      color: 'success'
    },
    {
      title: 'En correction',
      value: '23',
      change: '-8%',
      trend: 'down' as const,
      icon: Edit3,
      color: 'warning'
    },
    {
      title: 'Audio générés',
      value: '892',
      change: '+15%',
      trend: 'up' as const,
      icon: Volume2,
      color: 'info'
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-orange-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Bienvenue sur Chefito ! 👨‍🍳</h1>
        <p className="text-primary-100">
          Votre système autonome de scraping et d'IA culinaire fonctionne parfaitement.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Status */}
        <div className="lg:col-span-2">
          <SystemStatus />
        </div>

        {/* Recent Activity */}
        <div>
          <RecentActivity />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn-primary flex items-center justify-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Lancer scraping</span>
          </button>
          <button className="btn-secondary flex items-center justify-center space-x-2">
            <Edit3 className="h-4 w-4" />
            <span>Corriger recettes</span>
          </button>
          <button className="btn-secondary flex items-center justify-center space-x-2">
            <Volume2 className="h-4 w-4" />
            <span>Générer audio</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;