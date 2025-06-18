import React from 'react';
import { Clock, Download, Edit3, Volume2, CheckCircle } from 'lucide-react';

const RecentActivity: React.FC = () => {
  const activities = [
    {
      type: 'scraping',
      message: '387 nouvelles recettes scrapées',
      time: '2 min ago',
      icon: Download,
      color: 'text-blue-600'
    },
    {
      type: 'correction',
      message: '23 recettes corrigées automatiquement',
      time: '15 min ago',
      icon: Edit3,
      color: 'text-purple-600'
    },
    {
      type: 'audio',
      message: '156 fichiers audio générés',
      time: '1h ago',
      icon: Volume2,
      color: 'text-green-600'
    },
    {
      type: 'validation',
      message: '89 recettes validées et publiées',
      time: '2h ago',
      icon: CheckCircle,
      color: 'text-success-600'
    },
    {
      type: 'scraping',
      message: 'Quota Spoonacular: 8,743/10,000',
      time: '3h ago',
      icon: Download,
      color: 'text-blue-600'
    }
  ];

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité récente</h3>
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg bg-gray-50 ${activity.color}`}>
              <activity.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{activity.message}</p>
              <div className="flex items-center mt-1">
                <Clock className="h-3 w-3 text-gray-400 mr-1" />
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;