import React from 'react';
import DragDropTest from './DragDropTest';

/**
 * Wrapper component for rendering test elements
 */
const TestCoursesInSlotFix = () => {
  return (
    <div className="bug-fix-tests">
      <h2>Bug Fix Tests</h2>
      <p>The following tests verify fixes for known bugs:</p>
      
      <DragDropTest />
    </div>
  );
};

export default TestCoursesInSlotFix;
