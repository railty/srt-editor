import React, { useEffect } from 'react';
import useAppStore from '../stores/useAppStore';
import { useAudioStore } from '../stores';
import { AudioFileDisplay, SubtitleFileDisplay } from '../components/FileDisplay';
import ExportSrtButton from '../components/ExportSrtButton';

const Home = () => {
  const { audioFile, subtitleFile } = useAppStore();
  const { regions, importSrt } = useAudioStore();
  
  // Auto-import SRT data when files are loaded but no regions exist
  useEffect(() => {
    if (subtitleFile && subtitleFile.textContent && (!regions || regions.length === 0)) {
      console.log("Home component detected SRT file but no regions - auto-importing");
      importSrt(subtitleFile.textContent);
    }
  }, [subtitleFile, regions, importSrt]);

  return (
    <div className="mx-auto">
      {/* Display uploaded files */}
      <div className="mb-6 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
        {(!audioFile && !subtitleFile) ? (
          <p className="text-gray-500">
            No files uploaded yet. Use the Upload menu to get started.
          </p>
        ) : (
          <div className="space-y-4">
            <AudioFileDisplay file={audioFile} />
            <SubtitleFileDisplay file={subtitleFile} />
            
            <div className="text-sm space-y-4">
              <p className="mb-2">Ready to edit your subtitles!</p>
              <div className="flex space-x-4">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    // Functionality to be added later
                    alert('Edit functionality will be added in future updates');
                  }}
                >
                  Start Editing
                </button>
                
                <ExportSrtButton />
              </div>
            </div>
          </div>
        )}
      </div>
      
      <p className="mb-4">
        This is a powerful subtitle editor for creating and editing .srt files.
      </p>
      <p>
        Use the menu in the top left to navigate to different sections of the application.
      </p>
    </div>
  );
};

export default Home;
