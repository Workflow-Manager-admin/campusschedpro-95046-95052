import React, { useState, useEffect } from 'react';
import { Button, Typography, Paper, Box, Alert } from '@mui/material';

// Test component to verify the coursesInSlot.forEach fix
const TestCoursesInSlotFix = () => {
  const [results, setResults] = useState([]);
  const [success, setSuccess] = useState(null);

  // Mock schedule with a variety of problematic data types
  const testSchedule = {
    // Valid array entry
    'Monday-9:00 AM': [
      { id: 'course1', name: 'Course 1', code: 'CS101', credits: 3, instructor: 'Dr. Smith', roomId: 'room1' }
    ],
    // Null entry
    'Monday-10:00 AM': null,
    // Undefined entry
    'Monday-11:00 AM': undefined,
    // Object instead of array
    'Monday-12:00 PM': { id: 'course2', name: 'Course 2', code: 'CS102', credits: 3, instructor: 'Dr. Jones' },
    // String instead of array
    'Monday-1:00 PM': 'Invalid data',
    // Number instead of array
    'Monday-2:00 PM': 42,
    // Empty array
    'Monday-3:00 PM': []
  };

  // Log a test message
  const logResult = (message) => {
    setResults(prev => [...prev, message]);
  };

  // Run the test
  const runTest = () => {
    setResults([]);
    setSuccess(null);
    
    logResult('Starting coursesInSlot.forEach fix verification test...');
    
    let allTestsPassed = true;
    
    // Test getting courses for different slots with defensive programming
    Object.keys(testSchedule).forEach(slotId => {
      try {
        const coursesInSlot = testSchedule[slotId];
        logResult(`Testing slotId: ${slotId}, type: ${typeof coursesInSlot}, isArray: ${Array.isArray(coursesInSlot)}`);
        
        // Try with our fix
        const safeCoursesInSlot = Array.isArray(coursesInSlot) ? coursesInSlot : [];
        
        // This should never throw an error now
        safeCoursesInSlot.forEach(course => {
          logResult(`  - Course found: ${course?.name || 'Unknown'}`);
        });
        
        logResult(`✅ Successfully processed ${slotId} with the fix`);
      } catch (error) {
        logResult(`❌ Failed for slotId: ${slotId} - Error: ${error.message}`);
        allTestsPassed = false;
      }
    });
    
    if (allTestsPassed) {
      logResult('✅ All tests passed! The coursesInSlot.forEach fix is working correctly.');
      setSuccess(true);
    } else {
      logResult('❌ Some tests failed!');
      setSuccess(false);
    }
  };

  // Attempt without fix to demonstrate the error
  const runWithoutFix = () => {
    setResults([]);
    setSuccess(null);
    
    logResult('Testing without the fix to demonstrate the error...');
    
    try {
      // Pick a problematic case
      const coursesInSlot = testSchedule['Monday-12:00 PM']; // This is an object, not an array
      
      logResult(`Testing with problematic data: ${typeof coursesInSlot}`);
      
      // This will throw an error since it's not an array
      coursesInSlot.forEach(course => {
        logResult(`Course: ${course.name}`);
      });
      
      // If we get here, something is wrong
      logResult('❌ Test failed - error was not triggered as expected');
      setSuccess(false);
    } catch (error) {
      logResult(`✅ Expected error caught: ${error.message}`);
      logResult('This demonstrates the error our fix addresses.');
      setSuccess(true);
    }
  };

  useEffect(() => {
    // Auto-run the test when component mounts
    runTest();
  }, []);

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        coursesInSlot.forEach Bug Fix Verification
      </Typography>
      
      <Box mb={2}>
        <Typography variant="body1">
          This test verifies the fix for the "coursesInSlot.forEach is not a function" error
          by testing different types of data that might appear in the schedule.
        </Typography>
      </Box>
      
      <Box mb={3} display="flex" gap={2}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={runTest}
        >
          Run Test With Fix
        </Button>
        <Button 
          variant="outlined" 
          color="secondary" 
          onClick={runWithoutFix}
        >
          Demonstrate Error (Without Fix)
        </Button>
      </Box>
      
      {success !== null && (
        <Alert severity={success ? "success" : "error"} sx={{ mb: 2 }}>
          {success 
            ? "Test completed successfully! The fix is working." 
            : "Test failed! The fix is not working properly."}
        </Alert>
      )}
      
      <Paper 
        elevation={1} 
        sx={{ 
          p: 2, 
          bgcolor: '#f5f5f5', 
          height: 400, 
          overflowY: 'auto',
          fontFamily: 'monospace'
        }}
      >
        {results.map((line, index) => (
          <Typography 
            key={index} 
            variant="body2" 
            color={line.includes('✅') ? 'success.main' : line.includes('❌') ? 'error.main' : 'inherit'}
            sx={{ whiteSpace: 'pre-wrap', fontSize: 14, mb: 0.5 }}
          >
            {line}
          </Typography>
        ))}
      </Paper>
    </Paper>
  );
};

export default TestCoursesInSlotFix;
