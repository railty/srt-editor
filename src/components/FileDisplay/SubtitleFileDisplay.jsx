import React, { useState, useEffect } from 'react';
import { getSubtitleTextContent } from '../../utils/fileUtils';

const SubtitleFileDisplay = ({ file }) => {
  if (!file) return null;
  
  const [subtitleText, setSubtitleText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  
  // Load subtitle text content when component mounts
  useEffect(() => {
    const loadSubtitleText = async () => {
      // If we have direct text content, use it
      if (file.textContent) {
        const lines = file.textContent.split('\n').slice(0, 8);
        setSubtitleText(lines.join('\n'));
        return;
      }
      
      // Otherwise fall back to the utility function
      if (file.content) {
        const text = await getSubtitleTextContent(file);
        if (text) {
          // Only show first few lines in preview
          const lines = text.split('\n').slice(0, 8);
          setSubtitleText(lines.join('\n'));
        }
      }
    };
    
    if (file) {
      loadSubtitleText();
    }
  }, [file]);
  
  // Format file size in KB
  const formatSize = (bytes) => {
    return (bytes / 1024).toFixed(2);
  };
  
  return (
    <div className="bg-purple-50 p-4 rounded-md">
      <div className="flex items-center">
        <svg className="h-6 w-6 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <div>
          <h4 className="font-medium">Subtitle File</h4>
          <p className="text-sm text-gray-600">{file.name}</p>
          <p className="text-xs text-gray-500">
            Size: {formatSize(file.size)} KB
          </p>
          
          <button 
            className="text-xs text-blue-600 mt-1 hover:underline"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          
          {showPreview && subtitleText && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-32">
              <pre>{subtitleText}</pre>
              {subtitleText.split('\n').length > 7 && <p className="text-gray-500 italic">... more lines ...</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubtitleFileDisplay;
