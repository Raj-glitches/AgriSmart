import { useState, useEffect } from 'react';
import { userAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from '../components/common/Loader.jsx';

/**
 * Profile Page
 * User profile management and settings
 */

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.location?.address || '',
        city: user.location?.city || '',
        state: user.location?.state || '',
        country: user.location?.country || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (message) setMessage('');
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await updateProfile({
        name: formData.name,
        phone: formData.phone,
        location: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
        },
      });
      setMessage('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const roleColors = {
    farmer: 'bg-green-100 text-green-700',
    buyer: 'bg-blue-100 text-blue-700',
    expert: 'bg-purple-100 text-purple-700',
    admin: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-earth-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-earth-900 mb-8">My Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-24 h-24 rounded-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-primary-700">{user?.name?.[0]}</span>
                )}
              </div>
              <h2 className="text-xl font-bold text-earth-900">{user?.name}</h2>
              <p className="text-earth-500">{user?.email}</p>
              <span className={`inline-block mt-3 px-4 py-1 rounded-full text-sm font-medium capitalize ${
                roleColors[user?.role] || 'bg-earth-100 text-earth-600'
              }`}>
                {user?.role}
              </span>

              {user?.role === 'farmer' && user?.farmDetails && (
                <div className="mt-6 text-left">
                  <h3 className="font-semibold text-earth-900 mb-2">Farm Details</h3>
                  <div className="space-y-2 text-sm">
                    {user.farmDetails.farmName && (
                      <p className="text-earth-600"><span className="font-medium">Farm:</span> {user.farmDetails.farmName}</p>
                    )}
                    {user.farmDetails.farmSize > 0 && (
                      <p className="text-earth-600"><span className="font-medium">Size:</span> {user.farmDetails.farmSize} acres</p>
                    )}
                    {user.farmDetails.soilType && (
                      <p className="text-earth-600"><span className="font-medium">Soil:</span> {user.farmDetails.soilType}</p>
                    )}
                  </div>
                </div>
              )}

              {user?.role === 'expert' && user?.expertise && (
                <div className="mt-6 text-left">
                  <h3 className="font-semibold text-earth-900 mb-2">Expertise</h3>
                  <div className="space-y-2 text-sm">
                    {user.expertise.specialization && (
                      <p className="text-earth-600"><span className="font-medium">Specialization:</span> {user.expertise.specialization}</p>
                    )}
                    {user.expertise.experience > 0 && (
                      <p className="text-earth-600"><span className="font-medium">Experience:</span> {user.expertise.experience} years</p>
                    )}
                    {user.expertise.rating > 0 && (
                      <p className="text-earth-600"><span className="font-medium">Rating:</span> {user.expertise.rating}/5</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Edit Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-earth-900 mb-6">Edit Profile</h2>

              {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                  {message}
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-earth-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-earth-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-earth-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-earth-700 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-earth-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-earth-700 mb-1">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-earth-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-earth-700 mb-1">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-earth-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader size="small" /> : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

