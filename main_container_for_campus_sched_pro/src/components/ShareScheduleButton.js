import React, { useState } from 'react';
import PropTypes from 'prop-types';
import html2canvas from 'html2canvas';
import { Button, CircularProgress } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';

/**
 * Component for capturing and downloading a schedule as an image
 * PUBLIC_INTERFACE
 */
const ShareScheduleButton = ({ targetRef, onNotification }) => {
  const [isCapturing, setIsCapturing] = useState(false);

  /**
   * Generates a meaningful filename for the downloaded schedule
   * Format: campus-schedule-YYYY-MM-DD.png
   */
  const generateFilename = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `campus-schedule-${year}-${month}-${day}.png`;
  };

  /**
   * Handle the image capture and download process
   */
  const handleCaptureSchedule = async () => {
    if (!targetRef.current || isCapturing) {
      return;
    }

    try {
      setIsCapturing(true);
      
      // Show notification that capture is in progress
      if (onNotification) {
        onNotification('Capturing schedule as image...', 'info');
      }

      // Create a clone of the target element to modify for better capture
      const timetableEl = targetRef.current;
      
      // Use html2canvas with optimized settings
      const canvas = await html2canvas(timetableEl, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        allowTaint: true,
        // Capture the entire table, even parts not visible in the viewport
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight
      });
      
      // Convert to image data
      const imageData = canvas.toDataURL('image/png', 1.0);
      
      // Create download link with better filename
      const link = document.createElement('a');
      link.href = imageData;
      link.download = generateFilename();
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (onNotification) {
        onNotification('Schedule image downloaded successfully!', 'success');
      }
    } catch (error) {
      console.error('Error capturing schedule:', error);
      if (onNotification) {
        onNotification(`Failed to capture schedule: ${error.message}`, 'error');
      }
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <Button 
      variant="contained" 
      color="primary"
      onClick={handleCaptureSchedule}
      className="download-button"
      disabled={isCapturing}
      startIcon={isCapturing ? <CircularProgress size={20} color="inherit" /> : <ShareIcon />}
    >
      {isCapturing ? 'Capturing...' : 'Export Schedule as Image'}
    </Button>
  );
};

ShareScheduleButton.propTypes = {
  targetRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  onNotification: PropTypes.func
};

export default ShareScheduleButton;
