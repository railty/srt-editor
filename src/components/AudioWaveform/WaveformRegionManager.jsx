import React, { useEffect } from 'react';
import { useAudioStore } from '../../stores';
import { getInvertedColor } from '../../utils/srt/SrtParser';

/**
 * Component that manages events for waveform regions
 * This is a non-rendering component that only handles event logic
 */
const WaveformRegionManager = ({ 
  wavesurferRef, 
  regionsPluginRef, 
  isLoading 
}) => {
  // Get state and actions from audio store
  const { 
    selectRegion, 
    removeRegion,
    selectedRegionId,
    updateRegion
  } = useAudioStore();

  // Set up region events
  useEffect(() => {
    // Skip if not loaded yet or no regions plugin
    if (isLoading || !regionsPluginRef.current || !wavesurferRef.current) {
      return;
    }

    // Set up region events
    try {
      const regionsPlugin = regionsPluginRef.current;
      
      // Check if a previously selected region exists whenever selectedRegionId changes
      // This is to handle selections from the RegionsList component
      const regions = regionsPlugin.getRegions();
      
      // Find a previously highlighted region (that's not the current selection)
      regions.forEach(region => {
        if (region.id !== selectedRegionId && region.element) {
          // If this region has color applied but isn't selected, reset it
          if (region.element.classList.contains('region-selected')) {
            region.element.classList.remove('region-selected');
            if (region._originalColor) {
              region.setOptions({ color: region._originalColor });
            }
          }
        }
      });
      
      // Apply highlighting to the newly selected region
      if (selectedRegionId) {
        const selectedRegion = regions.find(r => r.id === selectedRegionId);
        if (selectedRegion) {
          // Store original color if not already stored
          if (!selectedRegion._originalColor) {
            selectedRegion._originalColor = selectedRegion.color;
          }
          
          // Add selection class 
          if (selectedRegion.element) {
            selectedRegion.element.classList.add('region-selected');
          }
          
          // Apply inverted color and enable resize
          const invertedColor = getInvertedColor(selectedRegion._originalColor);
          selectedRegion.setOptions({ 
            color: invertedColor,
            resize: true // Enable resize for selected region
          });
          
          // Force a redraw of the waveform
          if (wavesurferRef.current.drawer && typeof wavesurferRef.current.drawer.drawBuffer === 'function') {
            wavesurferRef.current.drawer.drawBuffer();
          }
          
          // Set playback position to the start of the selected region
          if (wavesurferRef.current && typeof wavesurferRef.current.setTime === 'function') {
            wavesurferRef.current.setTime(selectedRegion.start);
          }
        }
      }
      
      // Make sure non-selected regions have resize disabled
      regions.forEach(region => {
        if (region.id !== selectedRegionId) {
          region.setOptions({ resize: false });
        }
      });
      
      // Prevent region dragging
      const handleRegionDragStart = (region, e) => {
        // Prevent dragging the region as a whole
        // This is a backup measure in case 'drag: false' doesn't fully work
        e.stopPropagation();
        e.preventDefault();
        return false;
      };
      
      // Region click event
      const handleRegionClick = (region, e) => {
        // Prevent the default wavesurfer click behavior
        e.stopPropagation();
        
        // Get the previously selected region ID
        const previousRegionId = selectedRegionId;
        
        // If we're clicking the same region again, don't do anything special
        if (previousRegionId === region.id) {
          return;
        }
        
        // Update the selection state
        selectRegion(region.id);
        
        // Get all regions
        const regions = regionsPlugin.getRegions();
        
        // Reset the previously selected region if it exists
        if (previousRegionId) {
          const prevRegion = regions.find(r => r.id === previousRegionId);
          if (prevRegion) {
            // Restore original color if available
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
        
        // Store current region's original color before changing it
        if (!region._originalColor) {
          region._originalColor = region.color;
        }
        
        // Apply inverted color to the newly selected region and enable resize
        const invertedColor = getInvertedColor(region._originalColor);
        region.setOptions({ 
          color: invertedColor,
          resize: true // Enable resize only for selected region 
        });
        
        // Force a redraw of the waveform
        if (wavesurferRef.current.drawer && typeof wavesurferRef.current.drawer.drawBuffer === 'function') {
          wavesurferRef.current.drawer.drawBuffer();
        }
        
        // Apply selection class to the new region
        if (region.element) {
          region.element.classList.add('region-selected');
        }
        
        // Set playback position to the start of the selected region
        if (wavesurferRef.current && typeof wavesurferRef.current.setTime === 'function') {
          wavesurferRef.current.setTime(region.start);
        }
        
        // Emit a custom event to notify other components of the selection
        // This will be used by RegionsList to scroll the item into view
        document.dispatchEvent(new CustomEvent('region-selected-from-waveform', {
          detail: { regionId: region.id }
        }));
      };
      
      // Region removed event
      const handleRegionRemoved = (region) => {
        // Remove the region from our store
        removeRegion(region.id);
      };
      
      // Region updated event (when resized)
      const handleRegionUpdated = (region) => {
        console.log('Region updated:', region.id, 'Start:', region.start, 'End:', region.end);
        // Update the region in our store with new start/end times
        updateRegion(region.id, {
          start: region.start,
          end: region.end
        });
      };
      
      // Region update-end event (when resize is complete)
      const handleRegionUpdateEnd = (region) => {
        console.log('Region update ended:', region.id, 'Start:', region.start, 'End:', region.end);
        // Ensure the final state is updated in our store
        updateRegion(region.id, {
          start: region.start,
          end: region.end
        });
      };
      
      // Add event listeners
      regionsPlugin.on('region-clicked', handleRegionClick);
      regionsPlugin.on('region-removed', handleRegionRemoved);
      regionsPlugin.on('region-drag', handleRegionDragStart); // Prevent dragging
      regionsPlugin.on('region-updated', handleRegionUpdated); // Update times during resize
      regionsPlugin.on('region-update-end', handleRegionUpdateEnd); // Update times when resize completes
      
      // Set up click handler on waveform to maintain default behavior for clicks outside regions
      const waveformContainer = wavesurferRef.current.container;
      if (waveformContainer) {
        // This will run before WaveSurfer's internal click handler
        waveformContainer.addEventListener('click', (e) => {
          // Don't do anything special if clicking outside regions
          // WaveSurfer will handle this normally (setting playback position)
          // The region click handler will capture clicks inside regions
        });
      }
      
      // Clean up event listeners
      return () => {
        try {
          // Clean up events
          regionsPlugin.un('region-clicked', handleRegionClick);
          regionsPlugin.un('region-removed', handleRegionRemoved);
          regionsPlugin.un('region-drag', handleRegionDragStart);
          regionsPlugin.un('region-updated', handleRegionUpdated);
          regionsPlugin.un('region-update-end', handleRegionUpdateEnd);
          
          // Clean up waveform click handler
          const waveformContainer = wavesurferRef.current?.container;
          if (waveformContainer) {
            waveformContainer.removeEventListener('click', () => {});
          }
        } catch (error) {
          console.warn('Error removing region event listeners:', error);
        }
      };
    } catch (error) {
      console.error('Error setting up region events:', error);
    }
  }, [isLoading, regionsPluginRef, wavesurferRef, selectRegion, removeRegion, updateRegion, selectedRegionId]);

  // This component doesn't render anything
  return null;
};

export default WaveformRegionManager;