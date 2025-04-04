import React, { useEffect, useRef } from 'react';
import useAudioStore from '../../stores/audioStore';
import { getInvertedColor } from '../../utils/srt/SrtParser';

const RegionsList = ({ wavesurfer }) => {
  // Get regions and selection from store
  const { regions, removeRegion, selectedRegionId, selectRegion } = useAudioStore();

  // Ref to the table container for scrolling
  const tableContainerRef = useRef(null);
  // Ref to track the selected row for scrolling into view
  const selectedRowRef = useRef(null);

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

  if (!regions || regions.length === 0) {
    return (
      <div className="mt-4 text-sm text-gray-500 italic">
        No regions available. When you load an SRT file, regions will be created automatically.
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
                className={`border-b border-gray-100 ${region.id === selectedRegionId ? 'bg-yellow-50' : ''} hover:bg-gray-50 cursor-pointer`}
                style={{ borderLeft: `4px solid ${region.color?.replace('0.5', '0.8') || 'rgba(0,0,0,0.2)'}` }}
                onClick={() => handleRegionSelect(region.id)}
                ref={region.id === selectedRegionId ? selectedRowRef : null}
              >
                <td className="px-2 py-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSpeakerBadgeColor(region.speaker)}`}>
                    {getSpeakerLabel(region.speaker)}
                  </span>
                </td>
                <td className="px-2 py-1 font-medium">{region.label || `Region ${regions.indexOf(region) + 1}`}</td>
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