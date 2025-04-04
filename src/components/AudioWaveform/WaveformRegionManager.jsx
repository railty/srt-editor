import React, { useEffect } from 'react';
import { useAudioStore } from '../../stores';

/**
 * Component that manages events for waveform regions
 * This is a non-rendering component that only handles event logic
 */
const WaveformRegionManager = ({ 
  wavesurferRef, 
  regionsPluginRef, 
  isLoading 
}) => {
  // Get actions from audio store
  const { 
    selectRegion, 
    removeRegion 
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
      
      // Region click event
      const handleRegionClick = (region) => {
        // Select the region
        selectRegion(region.id);
        
        // Apply highlighting to the selected region
        if (regionsPlugin && regionsPlugin.getRegions) {
          const regions = regionsPlugin.getRegions();
          
          // Reset all regions to their original colors
          regions.forEach(r => {
            if (r.element && r.id !== region.id) {
              // Remove selection class if it exists
              r.element.classList.remove('region-selected');
            }
          });
          
          // Add selection style to clicked region
          if (region.element) {
            region.element.classList.add('region-selected');
          }
        }
      };
      
      // Region removed event
      const handleRegionRemoved = (region) => {
        // Remove the region from our store
        removeRegion(region.id);
      };
      
      // Add event listeners
      regionsPlugin.on('region-clicked', handleRegionClick);
      regionsPlugin.on('region-removed', handleRegionRemoved);
      
      // Clean up event listeners
      return () => {
        try {
          // Clean up events
          regionsPlugin.un('region-clicked', handleRegionClick);
          regionsPlugin.un('region-removed', handleRegionRemoved);
        } catch (error) {
          console.warn('Error removing region event listeners:', error);
        }
      };
    } catch (error) {
      console.error('Error setting up region events:', error);
    }
  }, [isLoading, regionsPluginRef, wavesurferRef, selectRegion, removeRegion]);

  // This component doesn't render anything
  return null;
};

export default WaveformRegionManager;