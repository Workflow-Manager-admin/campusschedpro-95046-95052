import React, { useState } from 'react';
import { Button } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import BulkImportModal from '../common/BulkImportModal';
import { generateFacultyTemplate, importFacultyFromExcel } from '../../utils/excelUtils';
import { useSchedule } from '../../context/ScheduleContext';

/**
 * Component for bulk importing faculty data
 * 
 * @param {Object} props - Component props
 * @param {function} props.onComplete - Callback when import is complete
 */
const FacultyBulkImport = ({ onComplete }) => {
  const [showModal, setShowModal] = useState(false);
  const { refreshData, showNotification } = useSchedule();

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleImportComplete = (result) => {
    if (result) {
      const { success, errors } = result;
      
      if (success > 0) {
        // Refresh the data to update the UI with new faculty
        refreshData();
        
        // Show appropriate notification based on whether there were errors
        if (errors && errors.length > 0) {
          showNotification(`Imported ${success} faculty with ${errors.length} errors`, 'warning');
        } else {
          showNotification(`Successfully imported ${success} faculty`, 'success');
        }
      } else if (errors && errors.length > 0) {
        showNotification(`Import failed: ${errors[0].message}`, 'error');
      }
    }
    
    // Call the onComplete callback if provided
    if (onComplete) {
      onComplete(result);
    }
    
    // Close the modal
    setTimeout(() => {
      setShowModal(false);
    }, 500);
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<UploadFileIcon />}
        onClick={handleOpenModal}
        sx={{ ml: 1 }}
      >
        Bulk Import
      </Button>
      
      <BulkImportModal
        open={showModal}
        onClose={handleCloseModal}
        title="Bulk Import Faculty"
        downloadTemplate={generateFacultyTemplate}
        importFunction={importFacultyFromExcel}
        onComplete={handleImportComplete}
        entityName="Faculty"
      />
    </>
  );
};

export default FacultyBulkImport;
