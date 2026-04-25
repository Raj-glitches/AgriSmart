import { useState, useEffect } from 'react';
import { expertAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from '../components/common/Loader.jsx';

/**
 * Expert Consultation Page
 * Q&A forum for farmers to ask questions and experts to respond
 */

const ExpertConsultation = () => {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
  });
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [response, setResponse] = useState('');

  const categories = [
    'crop_disease',
    'soil_management',
    'irrigation',
    'pest_control',
    'fertilizer',
    'harvesting',
    'market_price',
    'weather',
    'general',
  ];

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const params = user?.role === 'farmer' ? { myQuestions: 'true' } : {};
      const response = await expertAPI.getConsultations(params);
      setConsultations(response.data.data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await expertAPI.createConsultation(formData);
      setFormData({ title: '', description: '', category: 'general' });
      setShowForm(false);
      fetchConsultations();
    } catch (err) {
      alert('Failed to post question');
    }
  };

  const handleRespond = async (consultationId) => {
    if (!response.trim()) return;
    try {
      await expertAPI.respond(consultationId, { content: response });
      setResponse('');
      setSelectedConsultation(null);
      fetchConsultations();
    } catch (err) {
      alert('Failed to post response');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-earth-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-earth-900">👨‍🌾 Expert Consultation</h1>
            <p className="text-earth-500 mt-1">
              {user?.role === 'farmer' 
                ? 'Get answers from agricultural experts' 
                : 'Help farmers with their questions'}
            </p>
          </div>
          {user?.role === 'farmer' && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Ask a Question
            </button>
          )}
        </div>

        {/* Ask Form */}
        {showForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm mb-8 animate-fade-in">
            <h2 className="text-xl font-bold text-earth-900 mb-4">Post Your Question</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-earth-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Brief title of your question"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-earth-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-earth-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Describe your problem in detail..."
                  required
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                  Post Question
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border border-earth-300 rounded-lg hover:bg-earth-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Consultations List */}
        <div className="space-y-4">
          {consultations.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm">
              <div className="text-6xl mb-4">🌾</div>
              <h3 className="text-xl font-semibold text-earth-900 mb-2">No consultations yet</h3>
              <p className="text-earth-500">
                {user?.role === 'farmer' 
                  ? 'Ask your first question to get expert advice' 
                  : 'No open questions available'}
              </p>
            </div>
          ) : (
            consultations.map((consultation) => (
              <div key={consultation._id} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium capitalize mb-2">
                      {consultation.category.replace('_', ' ')}
                    </span>
                    <h3 className="text-lg font-semibold text-earth-900">{consultation.title}</h3>
                    <p className="text-sm text-earth-500">
                      By {consultation.farmer?.name} • {new Date(consultation.createdAt).toLocaleDateString()}
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

                <p className="text-earth-600 mb-4">{consultation.description}</p>

                {/* Responses */}
                {consultation.responses?.length > 0 && (
                  <div className="bg-earth-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-earth-900 mb-2">Responses</h4>
                    <div className="space-y-3">
                      {consultation.responses.map((resp, idx) => (
                        <div key={idx} className="border-l-4 border-primary-400 pl-4">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-700">
                              {resp.expert?.name?.[0]}
                            </div>
                            <span className="font-medium text-sm">{resp.expert?.name}</span>
                            <span className="text-xs text-earth-400">
                              {new Date(resp.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-earth-600 text-sm">{resp.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expert Response Form */}
                {user?.role === 'expert' && consultation.status !== 'closed' && (
                  <div className="mt-4">
                    {selectedConsultation === consultation._id ? (
                      <div className="space-y-3">
                        <textarea
                          value={response}
                          onChange={(e) => setResponse(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 border border-earth-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Write your response..."
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRespond(consultation._id)}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                          >
                            Post Response
                          </button>
                          <button
                            onClick={() => setSelectedConsultation(null)}
                            className="px-4 py-2 border border-earth-300 rounded-lg hover:bg-earth-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedConsultation(consultation._id)}
                        className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                      >
                        💬 Respond to this question
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpertConsultation;

