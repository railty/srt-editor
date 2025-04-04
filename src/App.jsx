import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import About from './pages/About';
import Settings from './pages/Settings';
import Home from './pages/Home';
import Upload from './pages/Upload';
import { useAppStore } from './stores';
import DatabaseDebugger from './components/DatabaseDebugger';

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

  // Update Layout to use the app store and handle navigation
  return (
    <>
      <Layout 
        onNavigate={setCurrentPage}
        currentPage={currentPage}
        status={status}
      >
        {renderPage()}
      </Layout>
      <DatabaseDebugger />
    </>
  );
}

export default App;
