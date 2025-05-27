import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Button,
  LinearProgress,
  Typography,
  IconButton,
  Alert,
  Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

/**
 * A reusable modal component for bulk importing data from Excel files.
 * Provides template download and file upload functionality.
 */
const BulkImportModal = ({ 
  open, 
  onClose, 
  title, 
  downloadTemplate, 
  importFunction, 
  onComplete, 
  entityName 
}) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Error wrapper will display download errors
  const handleDownloadTemplate = () => {
    setError(null);
    try {
      // Support both legacy and updated downloadTemplate signatures
      if (typeof downloadTemplate === 'function' && downloadTemplate.length >= 1) {
        downloadTemplate((errMsg) => {
          setError(errMsg || 'Failed to download template. Please try again.');
        });
      } else {
        downloadTemplate();
      }
    } catch (err) {
      console.error('Error downloading template:', err);
      setError('Failed to download template. Please try again.');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file to import');
      return;
    }

    setIsUploading(true);
    setProgress(10);
    setError(null);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Perform the actual import
      const importResult = await importFunction(file);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Set result summary
      setResult({
        successCount: importResult.success || 0,
        errorCount: importResult.errors?.length || 0,
        errors: importResult.errors || []
      });

      // Call the onComplete callback with the result
      if (onComplete) {
        setTimeout(() => {
          onComplete(importResult);
        }, 100);
      }
    } catch (err) {
      console.error('Error importing data:', err);
      setError(`Failed to import ${entityName.toLowerCase()}: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseAndReset = () => {
    setFile(null);
    setProgress(0);
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={isUploading ? undefined : handleCloseAndReset}
      maxWidth="sm"
      fullWidth
      className="bulk-import-modal"
    >
      <DialogTitle>
        {title}
        {!isUploading && (
          <IconButton
            aria-label="close"
            onClick={handleCloseAndReset}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500]
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
      
      <DialogContent dividers>
        {!result && (
          <>
            <Box className="template-download-section">
              <Typography variant="subtitle1" gutterBottom>
                Step 1: Download Template
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Download the Excel template, fill it with your {entityName.toLowerCase()} data, 
                and upload it in the next step.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleDownloadTemplate}
                disabled={isUploading}
                sx={{ mt: 1 }}
              >
                Download Template
              </Button>
            </Box>
            
            <Box className="file-upload-section" sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Step 2: Upload Your Data
              </Typography>
              
              <input
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                id="raised-button-file"
                type="file"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              
              <label htmlFor="raised-button-file">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  disabled={isUploading}
                  sx={{ mb: 2 }}
                >
                  Select File
                </Button>
              </label>
              
              {file && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected: {file.name}
                </Typography>
              )}
              
              {isUploading && (
                <Box sx={{ width: '100%', mt: 2 }}>
                  <LinearProgress variant="determinate" value={progress} />
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Processing... {progress}%
                  </Typography>
                </Box>
              )}
              
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Box>
          </>
        )}
        
        {result && (
          <Box className="import-results">
            <Alert 
              severity={result.errorCount > 0 ? "warning" : "success"}
              sx={{ mb: 2 }}
            >
              {result.errorCount > 0 
                ? `Imported ${result.successCount} ${entityName.toLowerCase()} with ${result.errorCount} errors`
                : `Successfully imported ${result.successCount} ${entityName.toLowerCase()}`
              }
            </Alert>
            
            {result.errorCount > 0 && (
              <Box className="error-list">
                <Typography variant="subtitle2" gutterBottom>
                  Errors:
                </Typography>
                <ul>
                  {result.errors.map((err, index) => (
                    <li key={index}>
                      <Typography variant="body2" color="error">
                        {err.message || err}
                      </Typography>
                    </li>
                  ))}
                </ul>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        {!result ? (
          <>
            <Button 
              onClick={handleCloseAndReset} 
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleImport}
              variant="contained"
              color="primary"
              disabled={!file || isUploading}
            >
              Import
            </Button>
          </>
        ) : (
          <Button 
            onClick={handleCloseAndReset}
            variant="contained"
            color="primary"
          >
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

BulkImportModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  downloadTemplate: PropTypes.func.isRequired,
  importFunction: PropTypes.func.isRequired,
  onComplete: PropTypes.func,
  entityName: PropTypes.string.isRequired
};

export default BulkImportModal;
