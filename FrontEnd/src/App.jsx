import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

// Layout
import Navbar from './components/common/Navbar.jsx';
import Footer from './components/common/Footer.jsx';
import PrivateRoute from './components/common/PrivateRoute.jsx';

// Auth Pages
import Login from './components/auth/Login.jsx';
import Register from './components/auth/Register.jsx';
import OTPVerification from './components/auth/OTPVerification.jsx';

// Public Pages
import Home from './pages/Home.jsx';
import Marketplace from './pages/Marketplace.jsx';
import ProductDetail from './components/marketplace/ProductDetail.jsx';
import Cart from './components/marketplace/Cart.jsx';
import Checkout from './components/marketplace/Checkout.jsx';

// Dashboard Pages
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';

// Feature Pages
import CropRecommendation from './pages/CropRecommendation.jsx';
import DiseaseDetection from './pages/DiseaseDetection.jsx';
import ExpertConsultation from './pages/ExpertConsultation.jsx';
import ChatPage from './pages/ChatPage.jsx';
import OrderTracking from './pages/OrderTracking.jsx';

// Admin
import AdminDashboard from './components/dashboard/AdminDashboard.jsx';

// Misc
import Loader from './components/common/Loader.jsx';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="large" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<OTPVerification />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/product/:id" element={<ProductDetail />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
          <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
          <Route path="/orders" element={<PrivateRoute><OrderTracking /></PrivateRoute>} />
          <Route path="/crop-recommendation" element={<PrivateRoute><CropRecommendation /></PrivateRoute>} />
          <Route path="/disease-detection" element={<PrivateRoute><DiseaseDetection /></PrivateRoute>} />
          <Route path="/expert-consultation" element={<PrivateRoute><ExpertConsultation /></PrivateRoute>} />
          <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
          <Route path="/chat/:chatId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />

          {/* Admin Routes */}
          <Route 
            path="/admin/*" 
            element={
              <PrivateRoute roles={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            } 
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;

