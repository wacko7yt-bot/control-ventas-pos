import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { Sales } from './components/Sales';
import { Toaster } from 'react-hot-toast';

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'inventory' | 'sales'>('dashboard');

  return (
    <div className="app-container">
      <Toaster position="top-right" />

      {/* Sidebar simplified with state control */}
      <Sidebar onViewChange={setCurrentView} currentView={currentView} />

      <div style={{ overflowY: 'auto', height: '100vh', width: '100%' }}>
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'inventory' && <Inventory />}
        {currentView === 'sales' && <Sales />}
      </div>
    </div>
  );
}

export default App;
