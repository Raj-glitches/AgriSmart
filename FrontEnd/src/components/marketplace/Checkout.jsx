// pages/checkout/Checkout.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useCart } from '../../context/CartContext.jsx';

import { orderAPI } from '../../services/api.js';

import Loader from '../common/Loader.jsx';

/**
 * =========================================
 * CHECKOUT PAGE
 * =========================================
 * Safe + validated + production-ready
 */

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'cod',
  });

  /**
   * =========================================
   * HANDLE INPUT CHANGE
   * =========================================
   */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError('');
  };

  /**
   * =========================================
   * VALIDATION
   * =========================================
   */
  const validateForm = () => {
    // Full name
    if (!formData.fullName.trim()) {
      return 'Full name is required';
    }

    if (formData.fullName.trim().length < 3) {
      return 'Full name must be at least 3 characters';
    }

    // Phone
    const cleanPhone = formData.phone.replace(/\s+/g, '');

    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(cleanPhone)) {
      return 'Enter a valid 10-digit Indian mobile number';
    }

    // Address
    if (!formData.address.trim()) {
      return 'Address is required';
    }

    if (formData.address.trim().length < 10) {
      return 'Address is too short';
    }

    // City
    if (!formData.city.trim()) {
      return 'City is required';
    }

    // State
    if (!formData.state.trim()) {
      return 'State is required';
    }

    // Pincode
    const pincodeRegex = /^[1-9][0-9]{5}$/;

    if (!pincodeRegex.test(formData.pincode)) {
      return 'Enter a valid 6-digit pincode';
    }

    // Cart validation
    if (!cartItems || cartItems.length === 0) {
      return 'Your cart is empty';
    }

    return null;
  };

  /**
   * =========================================
   * HANDLE SUBMIT
   * =========================================
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError('');
    setSuccess('');

    // Validate form
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      // Validate cart items
      const items = cartItems.map((item) => ({
        productId: item._id,
        quantity: Number(item.quantity),
        farmerId: item.farmerId,
      }));

      // Prevent invalid quantities
      const invalidItem = items.find(
        (item) =>
          !item.productId ||
          !item.quantity ||
          item.quantity <= 0
      );

      if (invalidItem) {
        setError('Some cart items are invalid');
        setLoading(false);
        return;
      }

      // Create order
      const response = await orderAPI.createOrder({
        items,

        shippingAddress: {
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
        },

        paymentMethod: formData.paymentMethod,
      });

      // Backend safety
      if (!response?.data?.success) {
        throw new Error(
          response?.data?.message ||
            'Failed to place order'
        );
      }

      setSuccess('Order placed successfully');

      // Clear cart safely
      clearCart();

      // Small delay for UX
      setTimeout(() => {
        navigate('/orders');
      }, 1000);
    } catch (err) {
      console.error('[Checkout] Order Error:', err);

      // Token expired
      if (err?.response?.status === 401) {
        setError('Session expired. Please login again');

        setTimeout(() => {
          navigate('/login');
        }, 1500);

        return;
      }

      // Forbidden
      if (err?.response?.status === 403) {
        setError(
          err?.response?.data?.message ||
            'You are not allowed to place orders'
        );

        return;
      }

      // Validation/backend errors
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to place order. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * =========================================
   * EMPTY CART
   * =========================================
   */
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-earth-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-sm">
          <h2 className="text-2xl font-bold text-earth-900 mb-2">
            Your Cart is Empty
          </h2>

          <p className="text-earth-500 mb-6">
            Add products before checkout
          </p>

          <button
            onClick={() => navigate('/marketplace')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  /**
   * =========================================
   * MAIN UI
   * =========================================
   */
  return (
    <div className="min-h-screen bg-earth-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Page Title */}
        <h1 className="text-3xl font-bold text-earth-900 mb-8">
          Checkout
        </h1>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ========================================= */}
          {/* SHIPPING FORM */}
          {/* ========================================= */}

          <div className="lg:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-xl p-6 shadow-sm space-y-6"
            >

              <h2 className="text-xl font-bold text-earth-900">
                Shipping Information
              </h2>

              {/* Name + Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="fullName"
                    required
                    maxLength={50}
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-earth-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">
                    Phone Number
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    required
                    maxLength={10}
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="9876543210"
                    className="w-full px-4 py-3 border border-earth-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">
                  Address
                </label>

                <textarea
                  name="address"
                  required
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street address, apartment, area..."
                  className="w-full px-4 py-3 border border-earth-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* City State Pincode */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">
                    City
                  </label>

                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Chennai"
                    className="w-full px-4 py-3 border border-earth-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">
                    State
                  </label>

                  <input
                    type="text"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Tamil Nadu"
                    className="w-full px-4 py-3 border border-earth-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {/* Pincode */}
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">
                    Pincode
                  </label>

                  <input
                    type="text"
                    name="pincode"
                    required
                    maxLength={6}
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="600001"
                    className="w-full px-4 py-3 border border-earth-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-3">
                  Payment Method
                </label>

                <div className="grid grid-cols-2 gap-4">

                  {[
                    {
                      value: 'cod',
                      label: 'Cash on Delivery',
                      icon: '💵',
                    },
                    {
                      value: 'upi',
                      label: 'UPI',
                      icon: '📱',
                    },
                    {
                      value: 'card',
                      label: 'Card',
                      icon: '💳',
                    },
                    {
                      value: 'wallet',
                      label: 'Wallet',
                      icon: '👛',
                    },
                  ].map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          paymentMethod: method.value,
                        }))
                      }
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        formData.paymentMethod === method.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-earth-200 hover:border-primary-300'
                      }`}
                    >
                      <span className="text-2xl mr-2">
                        {method.icon}
                      </span>

                      <span className="font-medium">
                        {method.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader size="small" />
                ) : (
                  `Place Order - ₹${getCartTotal().toFixed(2)}`
                )}
              </button>
            </form>
          </div>

          {/* ========================================= */}
          {/* ORDER SUMMARY */}
          {/* ========================================= */}

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm">

              <h2 className="text-xl font-bold text-earth-900 mb-4">
                Order Summary
              </h2>

              {/* Cart Items */}
              <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">

                {cartItems.map((item) => (
                  <div
                    key={item._id}
                    className="flex justify-between text-sm"
                  >
                    <div>
                      <span className="font-medium">
                        {item.name}
                      </span>

                      <span className="text-earth-400 ml-1">
                        x{item.quantity}
                      </span>
                    </div>

                    <span className="font-medium">
                      ₹
                      {(
                        item.price * item.quantity
                      ).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-earth-200 pt-4 space-y-2">

                <div className="flex justify-between text-earth-600">
                  <span>Subtotal</span>

                  <span>
                    ₹{getCartTotal().toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-earth-600">
                  <span>Shipping</span>

                  <span className="text-green-600">
                    Free
                  </span>
                </div>

                <div className="flex justify-between text-lg font-bold pt-2">
                  <span>Total</span>

                  <span className="text-primary-600">
                    ₹{getCartTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;