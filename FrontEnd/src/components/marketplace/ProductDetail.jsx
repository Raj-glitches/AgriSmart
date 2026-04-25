import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI } from '../../services/api.js';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Loader from '../common/Loader.jsx';

/**
 * Product Detail Page
 * Shows full product info with add to cart functionality
 */

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getProduct(id);
      setProduct(response.data.data);
    } catch (err) {
      setError('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    addToCart(product, quantity);
    // Show success toast or notification
    alert('Added to cart!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="large" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600">{error || 'Product not found'}</p>
          <button
            onClick={() => navigate('/marketplace')}
            className="mt-4 text-primary-600 hover:underline"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-earth-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/marketplace')}
          className="mb-6 flex items-center text-earth-600 hover:text-primary-600 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Marketplace
        </button>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Images */}
            <div>
              <div className="aspect-w-4 aspect-h-3 bg-earth-100 rounded-xl overflow-hidden">
                {product.images?.[activeImage] ? (
                  <img
                    src={product.images[activeImage]}
                    alt={product.name}
                    className="w-full h-96 object-cover"
                  />
                ) : (
                  <div className="w-full h-96 flex items-center justify-center text-earth-400">
                    <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              {product.images?.length > 1 && (
                <div className="flex gap-2 mt-4">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                        idx === activeImage ? 'border-primary-500' : 'border-transparent'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium capitalize">
                  {product.category}
                </span>
                {product.organic && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    Organic
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-earth-900 mb-2">{product.name}</h1>

              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${i < (product.rating || 0) ? 'fill-current' : 'text-earth-300'}`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-earth-500 ml-2">({product.reviews?.length || 0} reviews)</span>
              </div>

              <p className="text-3xl font-bold text-primary-600 mb-4">
                ₹{product.price}
                <span className="text-lg text-earth-400 font-normal"> / {product.unit}</span>
              </p>

              <p className="text-earth-600 mb-6">{product.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="bg-earth-50 p-3 rounded-lg">
                  <span className="text-earth-400">Available Quantity</span>
                  <p className="font-semibold text-earth-900">{product.quantity} {product.unit}</p>
                </div>
                <div className="bg-earth-50 p-3 rounded-lg">
                  <span className="text-earth-400">Location</span>
                  <p className="font-semibold text-earth-900">
                    {product.location?.city || 'Not specified'}
                  </p>
                </div>
                {product.harvestDate && (
                  <div className="bg-earth-50 p-3 rounded-lg">
                    <span className="text-earth-400">Harvest Date</span>
                    <p className="font-semibold text-earth-900">
                      {new Date(product.harvestDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div className="bg-earth-50 p-3 rounded-lg">
                  <span className="text-earth-400">Seller</span>
                  <p className="font-semibold text-earth-900">{product.farmer?.name || 'Unknown'}</p>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center border border-earth-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-3 hover:bg-earth-50 transition-colors"
                  >
                    -
                  </button>
                  <span className="px-4 py-3 font-semibold w-16 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                    className="px-4 py-3 hover:bg-earth-50 transition-colors"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3 px-6 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Add to Cart
                </button>
              </div>

              {/* Farmer Card */}
              {product.farmer && (
                <div className="border border-earth-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      {product.farmer.avatar ? (
                        <img src={product.farmer.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <span className="text-primary-700 font-bold text-lg">{product.farmer.name?.[0]}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-earth-900">{product.farmer.name}</p>
                      <div className="flex items-center text-sm text-earth-500">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {product.farmer.rating || 'New'} ({product.farmer.reviewCount || 0} reviews)
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

