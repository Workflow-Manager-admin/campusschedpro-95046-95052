import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';

/**
 * Redux-connected Droppable component
 * This ensures the Droppable has access to the Redux store
 * Fixes the "Could not find 'store' in the context of 'Connect(Droppable)'" error
 */
const ReduxDroppable = ({ droppableId, children, className, style }) => {
  // Connect to Redux store to ensure context is available to the Droppable
  const isDragging = useSelector(state => state.dragDrop.isDragging);
  
  return (
    <Droppable droppableId={droppableId}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={className}
          style={style}
        >
          {children(provided, snapshot, isDragging)}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

ReduxDroppable.propTypes = {
  droppableId: PropTypes.string.isRequired,
  children: PropTypes.func.isRequired,
  className: PropTypes.string,
  style: PropTypes.object
};

export default ReduxDroppable;
