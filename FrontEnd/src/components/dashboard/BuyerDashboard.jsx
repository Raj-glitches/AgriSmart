import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Loader from '../common/Loader.jsx';

/**
 * Buyer Dashboard
 * Order history, recommendations, and quick links
 */

const BuyerDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    delivered: 0,
    pending: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getMyOrders({ limit: 5 });
      const data = response.data.data;
      setOrders(data);
      
      // Calculate stats
      const delivered = data.filter((o) => o.status === 'delivered').length;
      const pending = data.filter((o) => o.status === 'pending').length;
      const spent = data
        .filter((o) => o.status === 'delivered')
        .reduce((acc, o) => acc + o.totalAmount, 0);
      
      setStats({
        totalOrders: data.length,
        delivered,
        pending,
        totalSpent: spent,
      });
    } catch (err) {
      console.error('Orders fetch error:', err);
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
        <h1 className="text-3xl font-bold text-earth-900">Welcome, {user?.name}!</h1>
        <p className="text-earth-500 mt-1">Manage your orders and discover fresh products</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Orders', value: stats.totalOrders, icon: '📋', color: 'blue' },
          { label: 'Delivered', value: stats.delivered, icon: '✅', color: 'green' },
          { label: 'Pending', value: stats.pending, icon: '⏳', color: 'yellow' },
          { label: 'Total Spent', value: `₹${stats.totalSpent.toFixed(2)}`, icon: '💳', color: 'purple' },
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

      {/* Recent Orders */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-earth-900">Recent Orders</h2>
          <Link to="/orders" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All
          </Link>
        </div>
        
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-earth-500 mb-4">No orders yet</p>
            <Link
              to="/marketplace"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order._id} className="flex items-center justify-between p-4 bg-earth-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    📦
                  </div>
                  <div>
                    <p className="font-medium text-earth-900">Order #{order._id.slice(-6)}</p>
                    <p className="text-sm text-earth-500">
                      {order.items.length} items - ₹{order.totalAmount}
                    </p>
                    <p className="text-xs text-earth-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/marketplace"
          className="bg-primary-50 border-2 border-primary-200 rounded-xl p-6 hover:border-primary-400 transition-colors text-center"
        >
          <div className="text-3xl mb-2">🛒</div>
          <h3 className="font-semibold text-earth-900">Browse Marketplace</h3>
          <p className="text-sm text-earth-500 mt-1">Discover fresh farm products</p>
        </Link>
        <Link
          to="/expert-consultation"
          className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 hover:border-blue-400 transition-colors text-center"
        >
          <div className="text-3xl mb-2">👨‍🌾</div>
          <h3 className="font-semibold text-earth-900">Ask an Expert</h3>
          <p className="text-sm text-earth-500 mt-1">Get farming advice</p>
        </Link>
        <Link
          to="/chat"
          className="bg-green-50 border-2 border-green-200 rounded-xl p-6 hover:border-green-400 transition-colors text-center"
        >
          <div className="text-3xl mb-2">💬</div>
          <h3 className="font-semibold text-earth-900">Messages</h3>
          <p className="text-sm text-earth-500 mt-1">Chat with sellers</p>
        </Link>
      </div>
    </div>
  );
};

export default BuyerDashboard;

