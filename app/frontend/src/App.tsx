import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import CaveAutorizzatePage from './pages/CaveAutorizzatePage';
import ActiveCavesPage from './pages/ActiveCavesPage';
import ExtractionsPage from './pages/ExtractionsPage';
import SalesPage from './pages/SalesPage';
import EconomicDataPage from './pages/EconomicDataPage';
import EmploymentPage from './pages/EmploymentPage';
import PricesPage from './pages/PricesPage';
import DestinationsPage from './pages/DestinationsPage';
import CompetitorsPage from './pages/CompetitorsPage';
import IndicatorsPage from './pages/IndicatorsPage';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/cave-autorizzate" element={<CaveAutorizzatePage />} />
        <Route path="/cave-attive" element={<ActiveCavesPage />} />
        <Route path="/estrazioni" element={<ExtractionsPage />} />
        <Route path="/vendite" element={<SalesPage />} />
        <Route path="/dati-economici" element={<EconomicDataPage />} />
        <Route path="/occupazione" element={<EmploymentPage />} />
        <Route path="/prezzi" element={<PricesPage />} />
        <Route path="/destinazioni" element={<DestinationsPage />} />
        <Route path="/concorrenti" element={<CompetitorsPage />} />
        <Route path="/indicatori" element={<IndicatorsPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;