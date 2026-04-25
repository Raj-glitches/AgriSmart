import { useAuth } from '../context/AuthContext.jsx';
import FarmerDashboard from '../components/dashboard/FarmerDashboard.jsx';
import BuyerDashboard from '../components/dashboard/BuyerDashboard.jsx';
import ExpertDashboard from '../components/dashboard/ExpertDashboard.jsx';

/**
 * Dashboard Page
 * Role-based dashboard rendering
 */

const Dashboard = () => {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user?.role) {
      case 'farmer':
        return <FarmerDashboard />;
      case 'buyer':
        return <BuyerDashboard />;
      case 'expert':
        return <ExpertDashboard />;
      case 'admin':
        return <FarmerDashboard />; // Admin sees farmer dashboard as default
      default:
        return <BuyerDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-earth-50">
      {renderDashboard()}
    </div>
  );
};

export default Dashboard;

