import useAppStore from '../store/useAppStore';
import { AudioFileDisplay, SubtitleFileDisplay } from '../components/FileDisplay';

const Home = () => {
  const { audioFile, subtitleFile } = useAppStore();

  return (
    <div className="mx-auto">
      <h2 className="text-2xl font-bold mb-6">Welcome to SRT Editor</h2>
      
      {/* Display uploaded files */}
      <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium mb-4">Your Files</h3>
        {(!audioFile && !subtitleFile) ? (
          <p className="text-gray-500">
            No files uploaded yet. Use the Upload menu to get started.
          </p>
        ) : (
          <div className="space-y-4">
            <AudioFileDisplay file={audioFile} />
            <SubtitleFileDisplay file={subtitleFile} />
            
            <div className="text-sm">
              <p className="mb-2">Ready to edit your subtitles!</p>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                onClick={() => {
                  // Functionality to be added later
                  alert('Edit functionality will be added in future updates');
                }}
              >
                Start Editing
              </button>
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
