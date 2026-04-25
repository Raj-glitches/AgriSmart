import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../services/api.js';
import Loader from '../components/common/Loader.jsx';

/**
 * Marketplace Page
 * Product listing with search, filter, and category selection
 */

const Marketplace = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    page: 1,
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [filters.category, filters.page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getProducts({
        ...filters,
        limit: 12,
      });
      setProducts(response.data.data);
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productAPI.getCategories();
      setCategories(response.data.data);
    } catch (err) {
      console.error('Failed to load categories');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const categoryIcons = {
    grains: '🌾',
    vegetables: '🥬',
    fruits: '🍎',
    dairy: '🥛',
    meat: '🍗',
    spices: '🌶️',
    seeds: '🌱',
    fertilizers: '💊',
    tools: '🔧',
    other: '📦',
  };

  return (
    <div className="min-h-screen bg-earth-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-earth-900">Agricultural Marketplace</h1>
          <p className="text-earth-500 mt-1">Discover fresh produce directly from farmers</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full px-4 py-3 border border-earth-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex gap-4">
              <input
                type="number"
                placeholder="Min Price"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                className="w-32 px-4 py-3 border border-earth-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="number"
                placeholder="Max Price"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                className="w-32 px-4 py-3 border border-earth-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setFilters({ ...filters, category: '' })}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !filters.category
                  ? 'bg-primary-600 text-white'
                  : 'bg-earth-100 text-earth-600 hover:bg-earth-200'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilters({ ...filters, category: cat })}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filters.category === cat
                    ? 'bg-primary-600 text-white'
                    : 'bg-earth-100 text-earth-600 hover:bg-earth-200'
                }`}
              >
                {categoryIcons[cat] || '📦'} {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader size="large" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-600">{error}</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-earth-500">
            <p className="text-xl">No products found</p>
            <p className="mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product._id}
                to={`/product/${product._id}`}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow group"
              >
                <div className="aspect-w-4 aspect-h-3 bg-earth-100">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center text-earth-400">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {product.organic && (
                    <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      Organic
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-earth-900 group-hover:text-primary-600 transition-colors">
                      {product.name}
                    </h3>
                    <span className="text-lg font-bold text-primary-600">₹{product.price}</span>
                  </div>
                  <p className="text-sm text-earth-500 mt-1">{product.farmer?.name || 'Unknown Farmer'}</p>
                  <p className="text-sm text-earth-400 mt-1">
                    {product.quantity} {product.unit} available
                  </p>
                  <div className="flex items-center mt-2">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${i < (product.rating || 0) ? 'fill-current' : 'text-earth-300'}`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs text-earth-400 ml-1">({product.reviews?.length || 0})</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;

