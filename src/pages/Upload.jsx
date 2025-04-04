import { useState, useRef } from 'react';
import useAppStore from '../stores/useAppStore';

const Upload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);
  const { setFiles: storeFiles, setStatus, setCurrentPage } = useAppStore();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFiles = async (fileList) => {
    const fileArray = Array.from(fileList);
    
    if (fileArray.length === 0) {
      return;
    }

    setFiles(fileArray);
    setErrorMessage('');

    // Find the first .m4a and .srt files
    const audioFile = fileArray.find(file => file.name.toLowerCase().endsWith('.m4a'));
    const subtitleFile = fileArray.find(file => file.name.toLowerCase().endsWith('.srt'));

    if (!audioFile && !subtitleFile) {
      setErrorMessage('Please upload at least one .m4a or .srt file.');
      return;
    }

    // Show loading state
    setStatus('Processing files...');
    
    try {
      // Store the files in Zustand (now async)
      await storeFiles(audioFile || null, subtitleFile || null);
      setStatus('Files uploaded successfully');
      setSuccess(true);
      
      // Navigate to Home after a short delay to show success message
      setTimeout(() => {
        setStatus('Ready');
        setCurrentPage('home');
      }, 1500);
    } catch (error) {
      console.error('Error processing files:', error);
      setErrorMessage('Error processing files. Please try again.');
      setStatus('Ready');
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    await processFiles(e.dataTransfer.files);
  };

  const handleChange = async (e) => {
    e.preventDefault();
    
    await processFiles(e.target.files);
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="mx-auto">
      <h2 className="text-2xl font-bold mb-6">Upload Files</h2>
      <p className="mb-4">
        Upload your audio (.m4a) and subtitle (.srt) files here.
      </p>

      <div 
        className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleChange}
          className="hidden"
          accept=".m4a,.srt"
        />
        
        <div className="space-y-4">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400" 
            stroke="currentColor" 
            fill="none" 
            viewBox="0 0 48 48" 
            aria-hidden="true"
          >
            <path 
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          </svg>
          <div className="text-gray-700">
            <p className="mb-2">Drag and drop files here, or</p>
            <button
              type="button"
              onClick={handleButtonClick}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Browse Files
            </button>
          </div>
          <p className="text-sm text-gray-500">
            Supports .m4a and .srt files
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p>{errorMessage}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 flex items-center">
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <p><strong>Success!</strong> Files uploaded successfully.</p>
            <p className="text-sm">Redirecting to Home page...</p>
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Selected files:</h3>
          <ul className="bg-gray-50 rounded-md p-4 divide-y divide-gray-200">
            {files.map((file, index) => (
              <li key={index} className="py-2 flex items-center">
                <svg className="h-5 w-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <span>
                  {file.name} 
                  <span className="ml-2 text-sm text-gray-500">
                    ({(file.size / 1024).toFixed(2)} KB)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Upload;
