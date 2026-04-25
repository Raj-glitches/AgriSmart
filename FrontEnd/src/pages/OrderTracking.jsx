import { useState, useEffect } from 'react';
import { orderAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from '../components/common/Loader.jsx';

/**
 * Order Tracking Page
 * View and track all orders for buyers and farmers
 */

const OrderTracking = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const api = user?.role === 'farmer' ? orderAPI.getFarmerOrders : orderAPI.getMyOrders;
      const response = await api({ limit: 50 });
      setOrders(response.data.data);
    } catch (err) {
      console.error('Orders fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter((o) => o.status === filter);

  const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

  const getStepIndex = (status) => statusSteps.indexOf(status);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-earth-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-earth-900 mb-2">My Orders</h1>
        <p className="text-earth-500 mb-8">Track and manage your orders</p>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
                filter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-earth-600 hover:bg-earth-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-earth-900 mb-2">No orders found</h3>
            <p className="text-earth-500">Orders will appear here once you make a purchase</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Order Header */}
                <div className="p-6 border-b border-earth-100">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                      <p className="text-sm text-earth-500">Order ID</p>
                      <p className="font-semibold text-earth-900">#{order._id.slice(-6)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-earth-500">Date</p>
                      <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-earth-500">Total</p>
                      <p className="font-bold text-primary-600">₹{order.totalAmount}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="px-6 py-4 bg-earth-50">
                  <div className="flex items-center justify-between">
                    {statusSteps.map((step, index) => {
                      const currentStep = getStepIndex(order.status);
                      const isCompleted = index <= currentStep;
                      const isCurrent = index === currentStep;

                      return (
                        <div key={step} className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            isCompleted 
                              ? 'bg-primary-600 text-white' 
                              : 'bg-earth-200 text-earth-400'
                          } ${isCurrent ? 'ring-4 ring-primary-200' : ''}`}>
                            {isCompleted ? '✓' : index + 1}
                          </div>
                          {index < statusSteps.length - 1 && (
                            <div className={`w-12 md:w-24 h-1 mx-1 ${
                              index < currentStep ? 'bg-primary-600' : 'bg-earth-200'
                            }`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-2">
                    {statusSteps.map((step) => (
                      <span key={step} className="text-xs text-earth-500 capitalize hidden md:block">
                        {step}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 py-3">
                      <div className="w-16 h-16 bg-earth-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-earth-400">📦</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-earth-900">{item.name}</p>
                        <p className="text-sm text-earth-500">
                          {item.quantity} {item.unit} × ₹{item.price}
                        </p>
                      </div>
                      <p className="font-semibold">₹{(item.quantity * item.price).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                {/* Tracking Updates */}
                {order.trackingUpdates?.length > 0 && (
                  <div className="px-6 pb-6">
                    <h4 className="font-medium text-earth-900 mb-2">Tracking History</h4>
                    <div className="space-y-2">
                      {order.trackingUpdates.map((update, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-sm">
                          <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">{update.message}</p>
                            <p className="text-earth-400">{new Date(update.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;

