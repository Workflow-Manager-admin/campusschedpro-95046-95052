import React, { useState } from 'react';
import { Button } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import BulkImportModal from './BulkImportModal';
import { generateCourseTemplate, importCoursesFromExcel } from '../../utils/excelUtils';
import { useSchedule } from '../../context/ScheduleContext';

/**
 * Component for bulk importing course data
 * 
 * @param {Object} props - Component props
 * @param {function} props.onComplete - Callback when import is complete
 */
const CourseBulkImport = ({ onComplete }) => {
  const [showModal, setShowModal] = useState(false);
  const { refreshData, showNotification } = useSchedule();

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleImportComplete = (result) => {
    // First close the modal
    setShowModal(false);

    // Then refresh data
    if (result && result.success > 0) {
      refreshData();
      showNotification(`Successfully imported ${result.success} courses`, 'success');
    } else if (result && result.errors && result.errors.length > 0) {
      showNotification(`Import had issues: ${result.errors[0].message}`, 'warning');
    }
    
    // Finally call the onComplete callback
    if (onComplete) {
      onComplete(result);
    }
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
        title="Bulk Import Courses"
        downloadTemplate={generateCourseTemplate}
        importFunction={importCoursesFromExcel}
        onComplete={handleImportComplete}
        entityName="Courses"
      />
    </>
  );
};

export default CourseBulkImport;
