import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api.js';
import AnalyticsCharts from '../analytics/AnalyticsCharts.jsx';
import Loader from '../common/Loader.jsx';

/**
 * Admin Dashboard
 * Platform management panel with stats, users, products, orders
 */

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const statsRes = await adminAPI.getStats();
      setStats(statsRes.data.data);

      const usersRes = await adminAPI.getUsers({ limit: 10 });
      setUsers(usersRes.data.data);

      const ordersRes = await adminAPI.getOrders({ limit: 10 });
      setOrders(ordersRes.data.data);
    } catch (err) {
      console.error('Admin dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = async (userId) => {
    try {
      await adminAPI.toggleUserStatus(userId);
      fetchDashboardData();
    } catch (err) {
      console.error('Toggle user error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="large" />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'orders', label: 'Orders', icon: '📦' },
  ];

  return (
    <div className="min-h-screen bg-earth-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-earth-900">Admin Panel</h1>
          <p className="text-earth-500 mt-1">Manage your platform</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-earth-600 hover:bg-earth-100'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Total Users', value: stats.counts?.totalUsers || 0, icon: '👥', color: 'blue' },
                { label: 'Farmers', value: stats.counts?.totalFarmers || 0, icon: '🌾', color: 'green' },
                { label: 'Products', value: stats.counts?.totalProducts || 0, icon: '📦', color: 'purple' },
                { label: 'Total Revenue', value: `₹${(stats.counts?.totalRevenue || 0).toFixed(2)}`, icon: '💰', color: 'yellow' },
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

            {/* Charts */}
            {stats.monthlyOrders?.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
                <h2 className="text-xl font-bold text-earth-900 mb-4">Monthly Revenue</h2>
                <AnalyticsCharts data={stats.monthlyOrders} type="revenue" />
              </div>
            )}

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-earth-900 mb-4">Recent Orders</h2>
                <div className="space-y-3">
                  {stats.recentOrders?.map((order) => (
                    <div key={order._id} className="flex justify-between items-center p-3 bg-earth-50 rounded-lg">
                      <div>
                        <p className="font-medium">Order #{order._id.slice(-6)}</p>
                        <p className="text-sm text-earth-500">
                          {order.buyer?.name} - ₹{order.totalAmount}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-earth-900 mb-4">Recent Users</h2>
                <div className="space-y-3">
                  {stats.recentUsers?.map((u) => (
                    <div key={u._id} className="flex items-center gap-3 p-3 bg-earth-50 rounded-lg">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-sm">
                        {u.name?.[0]}
                      </div>
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-sm text-earth-500">{u.email} - {u.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-earth-200">
              <h2 className="text-xl font-bold text-earth-900">All Users</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-earth-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-earth-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-earth-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-earth-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-earth-500 uppercase">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-earth-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-earth-200">
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-sm">
                            {u.name?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-earth-900">{u.name}</p>
                            <p className="text-sm text-earth-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize text-sm">{u.role}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-earth-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleUser(u._id)}
                          className={`text-sm font-medium ${
                            u.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'
                          }`}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-earth-200">
              <h2 className="text-xl font-bold text-earth-900">All Orders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-earth-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-earth-500 uppercase">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-earth-500 uppercase">Buyer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-earth-500 uppercase">Farmer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-earth-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-earth-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-earth-200">
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td className="px-6 py-4 font-medium">#{order._id.slice(-6)}</td>
                      <td className="px-6 py-4">{order.buyer?.name}</td>
                      <td className="px-6 py-4">{order.farmer?.name}</td>
                      <td className="px-6 py-4 font-medium">₹{order.totalAmount}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

