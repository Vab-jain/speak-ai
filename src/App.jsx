
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Settings, Home, BarChart2 } from 'lucide-react';
import { SettingsProvider } from './context/SettingsContext';
import LandingPage from './pages/LandingPage';
import SettingsPage from './pages/SettingsPage';
import DrillPage from './pages/DrillPage';
import ProgressPage from './pages/ProgressPage';

const Navbar = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/progress', icon: BarChart2, label: 'Progress' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-3 bg-card border border-border rounded-2xl shadow-2xl z-50">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              isActive 
                ? 'bg-accent-primary/10 text-accent-primary' 
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
            }`}
          >
            <Icon size={20} />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

const App = () => {
  return (
    <SettingsProvider>
      <Router>
        <div className="min-h-screen pb-24">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/drill" element={<DrillPage />} />
          </Routes>
          <Navbar />
        </div>
      </Router>
    </SettingsProvider>
  );
};

export default App;
