import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { orderAPI, productAPI, cropAPI } from '../../services/api.js';
import AnalyticsCharts from '../analytics/AnalyticsCharts.jsx';
import Loader from '../common/Loader.jsx';

/**
 * Farmer Dashboard
 * Overview of sales, products, crops, and analytics
 */

const FarmerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch orders
      const ordersRes = await orderAPI.getFarmerOrders({ limit: 5 });
      setRecentOrders(ordersRes.data.data);

      // Fetch products
      const productsRes = await productAPI.getMyProducts();
      setProducts(productsRes.data.data);

      // Fetch analytics
      const analyticsRes = await orderAPI.getOrderAnalytics();
      const data = analyticsRes.data.data;
      setStats(data.summary || {});
      setMonthlyData(data.monthlyRevenue || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
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
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-earth-900">Welcome, {user?.name}!</h1>
        <p className="text-earth-500 mt-1">Here's what's happening on your farm today</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Products', value: products.length, icon: '📦', color: 'blue' },
          { label: 'Total Orders', value: stats.totalOrders || 0, icon: '📋', color: 'green' },
          { label: 'Pending Orders', value: stats.pendingOrders || 0, icon: '⏳', color: 'yellow' },
          { label: 'Total Revenue', value: `₹${(stats.totalRevenue || 0).toFixed(2)}`, icon: '💰', color: 'purple' },
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

      {/* Analytics */}
      {monthlyData.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
          <h2 className="text-xl font-bold text-earth-900 mb-4">Revenue Analytics</h2>
          <AnalyticsCharts data={monthlyData} type="revenue" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-earth-900">Recent Orders</h2>
            <Link to="/orders" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All
            </Link>
          </div>
          
          {recentOrders.length === 0 ? (
            <p className="text-earth-500 text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between p-3 bg-earth-50 rounded-lg">
                  <div>
                    <p className="font-medium text-earth-900">Order #{order._id.slice(-6)}</p>
                    <p className="text-sm text-earth-500">
                      {order.buyer?.name} - ₹{order.totalAmount}
                    </p>
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

        {/* My Products */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-earth-900">My Products</h2>
            <Link to="/marketplace" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Add New
            </Link>
          </div>
          
          {products.length === 0 ? (
            <p className="text-earth-500 text-center py-8">No products listed yet</p>
          ) : (
            <div className="space-y-3">
              {products.slice(0, 5).map((product) => (
                <div key={product._id} className="flex items-center gap-3 p-3 bg-earth-50 rounded-lg">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-earth-200 rounded-lg flex items-center justify-center text-earth-400">
                      📦
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-earth-900">{product.name}</p>
                    <p className="text-sm text-earth-500">
                      ₹{product.price} / {product.unit} - {product.quantity} available
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    product.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {product.isAvailable ? 'Active' : 'Out of Stock'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/crop-recommendation"
          className="bg-primary-50 border-2 border-primary-200 rounded-xl p-6 hover:border-primary-400 transition-colors"
        >
          <div className="text-3xl mb-2">🌱</div>
          <h3 className="font-semibold text-earth-900">Crop Recommendation</h3>
          <p className="text-sm text-earth-500 mt-1">Get AI-powered crop suggestions</p>
        </Link>
        <Link
          to="/disease-detection"
          className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 hover:border-orange-400 transition-colors"
        >
          <div className="text-3xl mb-2">🔬</div>
          <h3 className="font-semibold text-earth-900">Disease Detection</h3>
          <p className="text-sm text-earth-500 mt-1">Upload images to detect plant diseases</p>
        </Link>
        <Link
          to="/expert-consultation"
          className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 hover:border-blue-400 transition-colors"
        >
          <div className="text-3xl mb-2">👨‍🌾</div>
          <h3 className="font-semibold text-earth-900">Ask an Expert</h3>
          <p className="text-sm text-earth-500 mt-1">Get advice from agricultural experts</p>
        </Link>
      </div>
    </div>
  );
};

export default FarmerDashboard;

