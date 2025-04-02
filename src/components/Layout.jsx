import { useState } from 'react';
import useAppStore from '../store/useAppStore';

const Layout = ({ children }) => {
  const { currentPage, setCurrentPage, status } = useAppStore();
  const [isAppMenuOpen, setIsAppMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleNavigate = (page) => {
    setCurrentPage(page);
    setIsAppMenuOpen(false); // Close menu after navigation
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex justify-between items-center bg-blue-600 text-white p-4">
        <div className="relative">
          <button 
            onClick={() => setIsAppMenuOpen(!isAppMenuOpen)}
            className="flex flex-col justify-center items-center space-y-1 p-2 hover:bg-blue-700 rounded"
            aria-label="Open application menu"
          >
            <span className="block w-6 h-0.5 bg-white"></span>
            <span className="block w-6 h-0.5 bg-white"></span>
            <span className="block w-6 h-0.5 bg-white"></span>
          </button>
          
          {/* App Menu Dropdown */}
          {isAppMenuOpen && (
            <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1" role="menu" aria-orientation="vertical">
                <button
                  onClick={() => handleNavigate('home')}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    currentPage === 'home' 
                      ? 'bg-gray-100 text-blue-600 font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  role="menuitem"
                >
                  Home
                </button>
                <button
                  onClick={() => handleNavigate('upload')}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    currentPage === 'upload' 
                      ? 'bg-gray-100 text-blue-600 font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  role="menuitem"
                >
                  Upload
                </button>
                <button
                  onClick={() => handleNavigate('about')}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    currentPage === 'about' 
                      ? 'bg-gray-100 text-blue-600 font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  role="menuitem"
                >
                  About
                </button>
                <button
                  onClick={() => handleNavigate('settings')}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    currentPage === 'settings' 
                      ? 'bg-gray-100 text-blue-600 font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  role="menuitem"
                >
                  Settings
                </button>
              </div>
            </div>
          )}
        </div>
        
        <h1 className="text-xl font-bold">SRT Editor</h1>
        
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center space-x-2 p-2 hover:bg-blue-700 rounded"
            aria-label="Open user menu"
          >
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-600">
              <span className="text-sm font-bold">U</span>
            </div>
          </button>
          
          {/* User Menu Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1" role="menu" aria-orientation="vertical">
                <button
                  onClick={() => {
                    /* Handle profile click */
                    setIsUserMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    /* Handle sign out click */
                    setIsUserMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
      
      {/* Main Content Area with Overflow Scrolling */}
      <main className="flex-1 overflow-auto p-4 bg-gray-50">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-200 p-4 flex items-center justify-between border-t border-gray-300">
        <div>
          {status === 'Ready' ? (
            <span className="text-green-600 flex items-center">
              <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
              Ready
            </span>
          ) : (
            <span className="text-yellow-600 flex items-center">
              <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse mr-2"></div>
              {status}
            </span>
          )}
        </div>
        <div className="text-gray-600 text-sm">
          © 2025 SRT Editor
        </div>
      </footer>
    </div>
  );
};

export default Layout;
