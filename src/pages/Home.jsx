const Home = () => {
  return (
    <div className="mx-auto">
      <h2 className="text-2xl font-bold mb-6">Welcome to SRT Editor</h2>
      <p className="mb-4">
        This is a powerful subtitle editor for creating and editing .srt files.
      </p>
      <p>
        Use the menu in the top left to navigate to different sections of the application.
      </p>
      
      {/* Example content to demonstrate scrolling */}
      <div className="mt-8 space-y-4">
        {Array.from({ length: 20 }).map((_, index) => (
          <div key={index} className="p-4 bg-gray-100 rounded">
            Sample content item {index + 1}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
