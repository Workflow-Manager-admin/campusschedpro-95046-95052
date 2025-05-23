import React from 'react';
import { useDispatch } from 'react-redux';
import { DragDropContext } from '@hello-pangea/dnd';
import { dragStart, dragEnd, updateDragState } from '../redux/actions/dragDropActions';

/**
 * A wrapper around DragDropContext that connects to Redux
 * This component ensures proper Redux integration with react-dnd
 */
const ReduxDragDropContext = ({ children, onDragEnd }) => {
  const dispatch = useDispatch();

  const handleDragStart = (start) => {
    // Dispatch drag start action to Redux
    dispatch(dragStart(start));
  };

  const handleDragUpdate = (update) => {
    // Update drag state in Redux store
    dispatch(updateDragState({
      sourceId: update.source.droppableId,
      destinationId: update.destination?.droppableId,
      draggableId: update.draggableId
    }));
  };

  const handleDragEnd = (result) => {
    // Dispatch drag end action to Redux
    dispatch(dragEnd());
    
    // Call the original onDragEnd handler if provided
    if (onDragEnd) {
      onDragEnd(result);
    }
  };

  return (
    <DragDropContext
      onDragStart={handleDragStart}
      onDragUpdate={handleDragUpdate}
      onDragEnd={handleDragEnd}
    >
      {children}
    </DragDropContext>
  );
};

export default ReduxDragDropContext;
