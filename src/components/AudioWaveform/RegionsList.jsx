import React, { useEffect, useRef, useState } from 'react';
import useAudioStore from '../../stores/useAudioStore';
import useAppStore from '../../stores/useAppStore';
import { getInvertedColor } from '../../utils/srt/SrtParser';

// Truncate long text for display
const truncateText = (text, maxLength = 30) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const RegionsList = ({ wavesurfer }) => {
  // Get regions and selection from store
  const { regions, removeRegion, selectedRegionId, selectRegion, updateRegion } = useAudioStore();
  const { subtitleFile } = useAppStore();
  
  // Debug: Log the regions data with more details for troubleshooting
  React.useEffect(() => {
    //console.log("RegionsList - regions count:", regions?.length || 0);
    
    // Log detailed info about the first few regions to help debugging
    if (regions && regions.length > 0) {
      //console.log("RegionsList - sample region details:", regions.slice(0, Math.min(3, regions.length)).map(r => ({ id: r.id, start: r.start, end: r.end })));
    }
  }, [regions]);
  
  // Auto reload regions from SRT file if needed
  useEffect(() => {
    // Only run this if we have a subtitle file but no regions
    if (subtitleFile && subtitleFile.textContent && (!regions || regions.length === 0)) {
      console.log("RegionsList detected SRT file but no regions - auto-importing");
      try {
        const { importSrt } = useAudioStore.getState();
        importSrt(subtitleFile.textContent);
      } catch (error) {
        console.error("Error auto-importing SRT in RegionsList:", error);
      }
    }
  }, [subtitleFile, regions]);

  // State for editing labels
  const [editingRegionId, setEditingRegionId] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const editInputRef = useRef(null);

  // Ref to the table container for scrolling
  const tableContainerRef = useRef(null);
  // Ref to track the selected row for scrolling into view
  const selectedRowRef = useRef(null);

  // Focus the input when editing starts
  useEffect(() => {
    if (editingRegionId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingRegionId]);

  // Listen for region selection from waveform
  useEffect(() => {
    const handleRegionSelectedFromWaveform = (event) => {
      const { regionId } = event.detail;
      
      // Find the selected region in our list
      const selectedRegion = regions.find(r => r.id === regionId);
      if (selectedRegion && tableContainerRef.current && selectedRowRef.current) {
        // Scroll the selected row into view with smooth behavior
        selectedRowRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest' 
        });
      }
    };
    
    // Add event listener
    document.addEventListener('region-selected-from-waveform', handleRegionSelectedFromWaveform);
    
    // Clean up
    return () => {
      document.removeEventListener('region-selected-from-waveform', handleRegionSelectedFromWaveform);
    };
  }, [regions]);

  // Effect to scroll to selected region when selectedRegionId changes
  useEffect(() => {
    if (selectedRegionId && selectedRowRef.current) {
      selectedRowRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  }, [selectedRegionId]);

  // Format time in MM:SS.mmm format
  const formatTime = (time) => {
    if (!time && time !== 0) return '00:00.000';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 1000);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  // Handle region selection from the list
  const handleRegionSelect = (regionId) => {
    // If we're editing, don't select on click
    if (editingRegionId) return;
    
    // First, check if this region is already selected
    if (regionId === selectedRegionId) {
      return; // Don't do anything if already selected
    }
    
    try {
      if (wavesurfer) {
        // Find the regions plugin
        const regionsPlugin = wavesurfer.plugins.find(plugin => plugin.getRegions && typeof plugin.getRegions === 'function');
        if (regionsPlugin) {
          const regions = regionsPlugin.getRegions();
          
          // Reset the previously selected region if it exists
          if (selectedRegionId) {
            const prevRegion = regions.find(r => r.id === selectedRegionId);
            if (prevRegion) {
              // Restore original color
              if (prevRegion._originalColor) {
                prevRegion.setOptions({ 
                  color: prevRegion._originalColor,
                  resize: false // Disable resize for previously selected region
                });
              }
              
              // Remove selection class
              if (prevRegion.element) {
                prevRegion.element.classList.remove('region-selected');
              }
            }
          }
          
          // Find the new region to select
          const newRegion = regions.find(r => r.id === regionId);
          if (newRegion) {
            // Store original color if not already stored
            if (!newRegion._originalColor) {
              newRegion._originalColor = newRegion.color;
            }
            
            // Apply inverted color and enable resize
            const invertedColor = getInvertedColor(newRegion._originalColor);
            newRegion.setOptions({ 
              color: invertedColor,
              resize: true // Enable resize only for selected region
            });
            
            // Force a redraw of the waveform if possible
            if (wavesurfer.drawer && typeof wavesurfer.drawer.drawBuffer === 'function') {
              wavesurfer.drawer.drawBuffer();
            }
            
            // Add selection class
            if (newRegion.element) {
              newRegion.element.classList.add('region-selected');
            }
            
            // Scroll to the region on the waveform
            wavesurfer.setTime(newRegion.start);
          }
        }
      }
    } catch (error) {
      console.warn('Error in handleRegionSelect:', error);
    }
    
    // Update the state
    selectRegion(regionId);
  };

  // Start editing a region label
  const startEditing = (e, region) => {
    e.stopPropagation(); // Prevent row selection
    setEditingRegionId(region.id);
    setEditingValue(region.label || `Region ${regions.indexOf(region) + 1}`);
  };

  // Save the edited label
  const saveLabel = () => {
    if (editingRegionId) {
      // Update region in store
      updateRegion(editingRegionId, { label: editingValue });
      
      // Update the region element in the waveform if possible
      if (wavesurfer) {
        try {
          const regionsPlugin = wavesurfer.plugins.find(plugin => plugin.getRegions && typeof plugin.getRegions === 'function');
          if (regionsPlugin) {
            const regions = regionsPlugin.getRegions();
            const region = regions.find(r => r.id === editingRegionId);
            if (region && region.element) {
              region.element.setAttribute('data-label', editingValue);
            }
          }
        } catch (error) {
          console.warn('Error updating region label in waveform:', error);
        }
      }
      
      // Exit editing mode
      setEditingRegionId(null);
    }
  };

  // Handle input keydown events (Ctrl+Enter to save, Escape to cancel)
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setEditingRegionId(null); // Cancel editing
    } else if (e.key === 'Enter' && e.ctrlKey) {
      // Save on Ctrl+Enter since textarea supports multiline
      saveLabel();
    }
  };

  // Delete region
  const deleteRegion = (regionId) => {
    // Always remove from store regardless of wavesurfer status
    try {
      if (wavesurfer) {
        try {
          // Find the regions plugin first
          const regionsPlugin = wavesurfer.plugins.find(plugin => plugin.getRegions && typeof plugin.getRegions === 'function');
          if (regionsPlugin) {
            const regions = regionsPlugin.getRegions();
            const region = regions.find(r => r.id === regionId);
            if (region) {
              region.remove();
              return; // Successfully removed, no need to call store action
            }
          }
        } catch (error) {
          console.warn('Error deleting region from wavesurfer:', error);
        }
      }
    } catch (error) {
      console.warn('Error in deleteRegion:', error);
    }
    
    // If we get here, we need to remove from store directly
    removeRegion(regionId);
  };

  // Seek to region
  const seekToRegion = (regionId) => {
    if (!wavesurfer) return;
    
    try {
      // Find the regions plugin first - more safely
      const regionsPlugin = wavesurfer.plugins.find(plugin => plugin.getRegions && typeof plugin.getRegions === 'function');
      if (!regionsPlugin) return;
      
      const regions = regionsPlugin.getRegions();
      const region = regions.find(r => r.id === regionId);
      if (region && typeof wavesurfer.setTime === 'function') {
        wavesurfer.setTime(region.start);
      }
    } catch (error) {
      console.warn('Error seeking to region:', error);
    }
  };

  // Play region
  const playRegion = (regionId) => {
    if (!wavesurfer) return;
    
    try {
      // Find the regions plugin first - more safely
      const regionsPlugin = wavesurfer.plugins.find(plugin => plugin.getRegions && typeof plugin.getRegions === 'function');
      if (!regionsPlugin) return;
      
      const regions = regionsPlugin.getRegions();
      const region = regions.find(r => r.id === regionId);
      if (region && typeof region.play === 'function') {
        region.play();
      }
    } catch (error) {
      console.warn('Error playing region:', error);
    }
  };

  // Function to get speaker label
  const getSpeakerLabel = (speaker) => {
    if (speaker === undefined || speaker === null) return '';
    return `Speaker ${speaker}`;
  };

  // Get speaker badge color
  const getSpeakerBadgeColor = (speaker) => {
    if (speaker === 0) {
      return 'bg-red-100 text-red-800';
    } else if (speaker === 1) {
      return 'bg-blue-100 text-blue-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if regions exist
  //console.log("RegionsList render - regions:", regions ? `count: ${regions.length}` : "null");
  
  if (!regions || regions.length === 0) {
    console.log("RegionsList showing empty state message");
    return (
      <div className="mt-4 space-y-2">
        <h4 className="font-medium mb-2">Subtitle Regions</h4>
        <div className="text-sm text-gray-500 italic">
          No regions available. When you load an SRT file, regions will be created automatically.
        </div>
        {subtitleFile && subtitleFile.textContent && (
          <div className="text-xs text-gray-400">
            Regions should load automatically. If they don't appear, you can try
            <button
              className="ml-1 text-blue-500 hover:text-blue-700 underline"
              onClick={() => {
                // Trigger a re-import of the SRT if we have an SRT file but no regions
                try {
                  console.log("Manually triggering SRT import");
                  const { importSrt } = useAudioStore.getState();
                  if (subtitleFile && subtitleFile.textContent) {
                    importSrt(subtitleFile.textContent);
                  }
                } catch (error) {
                  console.error("Error triggering SRT import:", error);
                }
              }}
            >
              reloading regions
            </button>
            from the SRT file.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h4 className="font-medium mb-2">Subtitle Regions</h4>
      <div className="max-h-40 overflow-y-auto" ref={tableContainerRef}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1 text-left">Speaker</th>
              <th className="px-2 py-1 text-left">Label</th>
              <th className="px-2 py-1 text-left">Start</th>
              <th className="px-2 py-1 text-left">End</th>
              <th className="px-2 py-1 text-left">Duration</th>
              <th className="px-2 py-1 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {regions.map((region) => (
              <tr 
                key={region.id} 
                className={`border-b border-gray-100 ${region.id === selectedRegionId ? 'bg-yellow-50' : ''} hover:bg-gray-50 cursor-pointer group`}
                style={{ borderLeft: `4px solid ${region.color?.replace('0.5', '0.8') || 'rgba(0,0,0,0.2)'}` }}
                onClick={() => handleRegionSelect(region.id)}
                ref={region.id === selectedRegionId ? selectedRowRef : null}
              >
                <td className="px-2 py-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSpeakerBadgeColor(region.speaker)}`}>
                    {getSpeakerLabel(region.speaker)}
                  </span>
                </td>
                <td className="px-2 py-1 font-medium relative">
                  {editingRegionId === region.id ? (
                    <div 
                      onClick={(e) => e.stopPropagation()} 
                      className="w-full"
                      style={{ 
                        position: 'absolute', 
                        zIndex: 50, 
                        background: 'white',
                        minWidth: '300px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                      }}
                    >
                      <textarea
                        ref={editInputRef}
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={saveLabel}
                        onKeyDown={handleKeyDown}
                        className="w-full px-2 py-1 text-sm border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                        rows={Math.min(6, (editingValue.match(/\n/g) || []).length + 2)}
                        style={{ minHeight: '80px', resize: 'vertical' }}
                        placeholder="Enter label text here... (Ctrl+Enter to save)"
                      />
                      <div className="text-xs text-gray-500 p-1 bg-gray-50">
                        Press Ctrl+Enter to save or Escape to cancel
                      </div>
                    </div>
                  ) : (
                    <div className="relative group">
                      {truncateText(region.label || `Region ${regions.indexOf(region) + 1}`)}
                      
                      {/* Full text tooltip for long labels */}
                      {region.label && region.label.length > 30 && (
                        <div 
                          className="absolute bottom-full left-0 p-2 bg-white border border-gray-200 rounded shadow-lg 
                                    opacity-0 group-hover:opacity-100 transition-opacity z-50 w-64 text-xs"
                          style={{ marginBottom: '5px', maxHeight: '200px', overflowY: 'auto' }}
                        >
                          {region.label}
                        </div>
                      )}
                      
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                        <button
                          onClick={(e) => startEditing(e, region)}
                          className="text-gray-500 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Edit label"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-2 py-1">{formatTime(region.start)}</td>
                <td className="px-2 py-1">{formatTime(region.end)}</td>
                <td className="px-2 py-1">{formatTime(region.end - region.start)}</td>
                <td className="px-2 py-1 flex space-x-1">
                  {region.id === selectedRegionId && (
                    <div className="flex items-center mr-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      seekToRegion(region.id);
                    }}
                    className="text-blue-500 hover:text-blue-700 p-1"
                    title="Seek to region"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      playRegion(region.id);
                    }}
                    className="text-green-500 hover:text-green-700 p-1"
                    title="Play region"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm9 4a1 1 0 10-2 0v6a1 1 0 102 0V7zm-3 2a1 1 0 10-2 0v4a1 1 0 102 0V9zm-3 3a1 1 0 10-2 0v1a1 1 0 102 0v-1z" />
                    </svg>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRegion(region.id);
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Delete region"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RegionsList;