import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import About from './pages/About';
import Settings from './pages/Settings';
import Home from './pages/Home';
import Upload from './pages/Upload';
import useAppStore from './store/useAppStore';

function App() {
  const { currentPage, setCurrentPage, status, setStatus } = useAppStore();
  
  // Example of dynamic content based on current page
  const renderPage = () => {
    switch (currentPage) {
      case 'about':
        return <About />;
      case 'settings':
        return <Settings />;
      case 'upload':
        return <Upload />;
      default:
        return <Home />
    }
  };

  // Example of using the app store to update status
  useEffect(() => {
    // Just a demo - in a real app, you might update status based on operations
    const timer = setTimeout(() => {
      if (status === 'Ready') {
        setStatus('Processing...');
        setTimeout(() => setStatus('Ready'), 2000);
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [status, setStatus]);

  // Update Layout to use the app store and handle navigation
  return (
    <Layout 
      onNavigate={setCurrentPage}
      currentPage={currentPage}
      status={status}
    >
      {renderPage()}
    </Layout>
  );
}

export default App;
