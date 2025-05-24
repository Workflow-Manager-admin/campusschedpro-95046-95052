import React, { useState } from 'react';
import { Button } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import BulkImportModal from '../common/BulkImportModal';
import { generateFacultyTemplate, importFacultyFromExcel } from '../../utils/excelUtils';

/**
 * Component for bulk importing faculty data
 * 
 * @param {Object} props - Component props
 * @param {function} props.onComplete - Callback when import is complete
 */
const FacultyBulkImport = ({ onComplete }) => {
  const [showModal, setShowModal] = useState(false);

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleImportComplete = (result) => {
    // Wait a moment before triggering the onComplete callback
    setTimeout(() => {
      if (onComplete) {
        onComplete(result);
      }
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
