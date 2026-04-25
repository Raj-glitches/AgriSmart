import { useState } from 'react';
import Loader from '../components/common/Loader.jsx';

/**
 * Disease Detection Page
 * Plant disease detection via image upload
 * In production, this would connect to a ML API
 */

const DiseaseDetection = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    
    setLoading(true);
    
    // Simulate API call - in production, send image to ML API
    setTimeout(() => {
      // Mock results for demo
      const mockResults = [
        {
          disease: 'Late Blight',
          confidence: 92,
          description: 'A serious disease affecting tomatoes and potatoes caused by Phytophthora infestans.',
          treatment: 'Apply fungicides containing chlorothalonil or mancozeb. Remove infected plant parts.',
          prevention: 'Ensure proper spacing for air circulation. Avoid overhead watering.',
        },
        {
          disease: 'Powdery Mildew',
          confidence: 85,
          description: 'A fungal disease that appears as white powdery spots on leaves.',
          treatment: 'Use neem oil or sulfur-based fungicides. Prune affected areas.',
          prevention: 'Plant in sunny locations. Maintain proper spacing.',
        },
        {
          disease: 'Leaf Spot',
          confidence: 78,
          description: 'Brown or black spots on leaves caused by various fungi or bacteria.',
          treatment: 'Remove infected leaves. Apply copper-based fungicide.',
          prevention: 'Water at the base. Mulch to prevent soil splash.',
        },
      ];

      setResult(mockResults[Math.floor(Math.random() * mockResults.length)]);
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-earth-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-earth-900">🔬 Plant Disease Detection</h1>
          <p className="text-earth-500 mt-2">Upload a photo of your plant to detect diseases early</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl p-8 shadow-sm mb-8">
          <div className="border-2 border-dashed border-earth-300 rounded-xl p-8 text-center hover:border-primary-400 transition-colors">
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                <button
                  onClick={() => { setImage(null); setPreview(null); setResult(null); }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <div className="text-6xl mb-4">📸</div>
                <p className="text-earth-600 mb-4">Drag and drop or click to upload a plant image</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="disease-image"
                />
                <label
                  htmlFor="disease-image"
                  className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer transition-colors"
                >
                  Choose Image
                </label>
              </>
            )}
          </div>

          {preview && (
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full mt-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader size="small" /> : 'Analyze Plant'}
            </button>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-xl p-8 shadow-sm animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                ⚠️
              </div>
              <div>
                <h2 className="text-2xl font-bold text-earth-900">{result.disease}</h2>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-earth-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${result.confidence}%` }}
                    />
                  </div>
                  <span className="text-sm text-earth-500">{result.confidence}% confidence</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-earth-50 rounded-lg p-4">
                <h3 className="font-semibold text-earth-900 mb-2">Description</h3>
                <p className="text-earth-600">{result.description}</p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">💊 Treatment</h3>
                <p className="text-green-800">{result.treatment}</p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">🛡️ Prevention</h3>
                <p className="text-blue-800">{result.prevention}</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 rounded-lg text-sm text-yellow-800">
              ⚠️ This is an AI-assisted analysis. Please consult a local agricultural expert for confirmation and personalized advice.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiseaseDetection;

