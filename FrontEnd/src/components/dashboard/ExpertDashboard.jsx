import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { expertAPI } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Loader from '../common/Loader.jsx';

/**
 * Expert Dashboard
 * Consultations overview and expert stats
 */

const ExpertDashboard = () => {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    resolved: 0,
    rating: user?.expertise?.rating || 0,
  });

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const response = await expertAPI.getConsultations();
      const data = response.data.data;
      setConsultations(data.slice(0, 5));
      
      setStats({
        total: data.length,
        open: data.filter((c) => c.status === 'open').length,
        resolved: data.filter((c) => c.status === 'resolved').length,
        rating: user?.expertise?.rating || 0,
      });
    } catch (err) {
      console.error('Consultations fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-earth-900">Welcome, Dr. {user?.name}!</h1>
        <p className="text-earth-500 mt-1">Manage your consultations and help farmers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Consultations', value: stats.total, icon: '📋', color: 'blue' },
          { label: 'Open Questions', value: stats.open, icon: '❓', color: 'yellow' },
          { label: 'Resolved', value: stats.resolved, icon: '✅', color: 'green' },
          { label: 'Rating', value: stats.rating > 0 ? `${stats.rating}/5` : 'New', icon: '⭐', color: 'purple' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-earth-500 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-earth-900 mt-1">{stat.value}</p>
              </div>
              <span className="text-3xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Consultations */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-earth-900">Recent Consultations</h2>
          <Link to="/expert-consultation" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All
          </Link>
        </div>
        
        {consultations.length === 0 ? (
          <p className="text-earth-500 text-center py-8">No consultations yet</p>
        ) : (
          <div className="space-y-3">
            {consultations.map((consultation) => (
              <div key={consultation._id} className="flex items-center justify-between p-4 bg-earth-50 rounded-lg">
                <div>
                  <p className="font-medium text-earth-900">{consultation.title}</p>
                  <p className="text-sm text-earth-500">
                    By {consultation.farmer?.name} - {consultation.category}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                  consultation.status === 'resolved' ? 'bg-green-100 text-green-700' :
                  consultation.status === 'open' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {consultation.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/expert-consultation"
          className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 hover:border-blue-400 transition-colors"
        >
          <div className="text-3xl mb-2">👨‍🌾</div>
          <h3 className="font-semibold text-earth-900">Answer Questions</h3>
          <p className="text-sm text-earth-500 mt-1">Help farmers with their queries</p>
        </Link>
        <Link
          to="/chat"
          className="bg-green-50 border-2 border-green-200 rounded-xl p-6 hover:border-green-400 transition-colors"
        >
          <div className="text-3xl mb-2">💬</div>
          <h3 className="font-semibold text-earth-900">Messages</h3>
          <p className="text-sm text-earth-500 mt-1">Chat with farmers directly</p>
        </Link>
      </div>
    </div>
  );
};

export default ExpertDashboard;

