import { useEffect, useState } from 'react';
import './App.css';
import './i18n';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Joyride } from 'react-joyride';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ActionPlan from './pages/ActionPlan';
import Marketplace from './pages/Marketplace';
import Settings from './pages/Settings';
import PaymentSuccess from './pages/PaymentSuccess';
import Guidebook from './pages/Guidebook';
import { Toaster } from './components/ui/sonner';

const tourSteps = [
  {
    target: '[data-tour="navigation"]',
    content: 'Welcome to Verdant! Use this navigation to explore different sections of your farm management platform.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="profit-graph"]',
    content: 'Track your projected profits with our interactive profit predictor. Switch between different crops to compare earnings.',
  },
  {
    target: '[data-tour="marketplace"]',
    content: 'Access our verified marketplace to purchase seeds, fertilizers, and rent equipment from trusted suppliers.',
  },
];

function App() {
  const { i18n } = useTranslation();
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    const tourCompleted = localStorage.getItem('verdant_tour_completed');
    if (!tourCompleted) {
      setTimeout(() => setRunTour(true), 1000);
    }
  }, []);

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    if (status === 'finished' || status === 'skipped') {
      localStorage.setItem('verdant_tour_completed', 'true');
      setRunTour(false);
    }
  };

  const restartTour = () => {
    localStorage.removeItem('verdant_tour_completed');
    setRunTour(true);
  };

  return (
    <div className="App">
      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#064E3B',
            zIndex: 10000,
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout restartTour={restartTour} />}>
            <Route index element={<Dashboard />} />
            <Route path="action-plan" element={<ActionPlan />} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="help-and-settings" element={<Settings restartTour={restartTour} />} />
            <Route path="guidebook" element={<Guidebook />} />
            <Route path="payment-success" element={<PaymentSuccess />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;