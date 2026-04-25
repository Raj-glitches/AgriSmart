import { useState } from 'react';
import { cropAPI } from '../services/api.js';
import Loader from '../components/common/Loader.jsx';

/**
 * Crop Recommendation Page
 * AI-powered crop suggestions based on location and soil
 */

const CropRecommendation = () => {
  const [formData, setFormData] = useState({
    lat: '',
    lon: '',
    soilType: 'loamy',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const soilTypes = [
    { value: 'clay', label: 'Clay Soil', desc: 'Heavy, retains water well' },
    { value: 'sandy', label: 'Sandy Soil', desc: 'Light, drains quickly' },
    { value: 'loamy', label: 'Loamy Soil', desc: 'Balanced, ideal for most crops' },
    { value: 'black', label: 'Black Soil', desc: 'Rich in minerals, good for cotton' },
    { value: 'red', label: 'Red Soil', desc: 'Iron-rich, good for groundnuts' },
    { value: 'alluvial', label: 'Alluvial Soil', desc: 'Fertile, river-deposited' },
  ];

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            lat: position.coords.latitude.toFixed(4),
            lon: position.coords.longitude.toFixed(4),
          });
        },
        (err) => {
          setError('Could not get location. Please enter coordinates manually.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await cropAPI.getRecommendations({
        lat: formData.lat,
        lon: formData.lon,
        soilType: formData.soilType,
      });
      setResult(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-earth-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-earth-900">🌾 AI Crop Recommendation</h1>
          <p className="text-earth-500 mt-2">Get personalized crop suggestions based on your location and soil type</p>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-xl p-8 shadow-sm mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-earth-700">Location Coordinates</label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Use My Location
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                  className="px-4 py-3 border border-earth-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  value={formData.lon}
                  onChange={(e) => setFormData({ ...formData, lon: e.target.value })}
                  className="px-4 py-3 border border-earth-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>

            {/* Soil Type */}
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-2">Soil Type</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {soilTypes.map((soil) => (
                  <button
                    key={soil.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, soilType: soil.value })}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      formData.soilType === soil.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-earth-200 hover:border-primary-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{soil.label}</div>
                    <div className="text-xs text-earth-500 mt-0.5">{soil.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader size="small" /> : 'Get Recommendations'}
            </button>
          </form>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-xl p-8 shadow-sm animate-fade-in">
            <h2 className="text-2xl font-bold text-earth-900 mb-6">Recommended Crops</h2>
            
            {/* Weather Info */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Current Weather</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Temperature</span>
                  <p className="font-bold">{result.currentWeather?.temperature}°C</p>
                </div>
                <div>
                  <span className="text-blue-600">Humidity</span>
                  <p className="font-bold">{result.currentWeather?.humidity}%</p>
                </div>
                <div>
                  <span className="text-blue-600">Condition</span>
                  <p className="font-bold capitalize">{result.currentWeather?.description}</p>
                </div>
                <div>
                  <span className="text-blue-600">Location</span>
                  <p className="font-bold">{result.currentWeather?.city}</p>
                </div>
              </div>
            </div>

            {/* Crop Suggestions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {result.suggestedCrops?.map((crop, idx) => (
                <div
                  key={idx}
                  className="bg-primary-50 border-2 border-primary-200 rounded-xl p-6 text-center hover:border-primary-400 transition-colors"
                >
                  <div className="text-4xl mb-2">🌱</div>
                  <h3 className="font-bold text-primary-900">{crop}</h3>
                </div>
              ))}
            </div>

            <p className="text-sm text-earth-500 bg-earth-50 p-3 rounded-lg">
              💡 {result.note}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CropRecommendation;

