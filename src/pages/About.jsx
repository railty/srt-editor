const About = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">About SRT Editor</h2>
      <p className="mb-4">
        SRT Editor is a powerful tool for editing subtitle files. It provides an intuitive
        interface for creating, editing, and synchronizing subtitles for your videos.
      </p>
      <p className="mb-4">
        This application is built with React, Vite, Tailwind CSS, and Zustand for state management.
      </p>
      <h3 className="text-xl font-bold mb-2 mt-6">Features</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>Edit .srt subtitle files</li>
        <li>Synchronize subtitles with video</li>
        <li>Add, remove, and reorder subtitle entries</li>
        <li>Export to various subtitle formats</li>
        <li>Modern and responsive interface</li>
      </ul>
    </div>
  );
};

export default About;
