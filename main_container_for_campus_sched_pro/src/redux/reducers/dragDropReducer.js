// Drag-and-drop reducer to manage state during drag operations

const initialState = {
  isDragging: false,
  sourceId: null,
  destinationId: null,
  draggableId: null
};

// Action types
export const DRAG_START = 'drag/DRAG_START';
export const DRAG_END = 'drag/DRAG_END';
export const UPDATE_DRAG_STATE = 'drag/UPDATE_DRAG_STATE';

// Reducer
const dragDropReducer = (state = initialState, action) => {
  switch (action.type) {
    case DRAG_START:
      return {
        ...state,
        isDragging: true,
        sourceId: action.payload.source.droppableId,
        draggableId: action.payload.draggableId
      };
    case DRAG_END:
      return {
        ...state,
        isDragging: false,
        sourceId: null,
        destinationId: null,
        draggableId: null
      };
    case UPDATE_DRAG_STATE:
      return {
        ...state,
        ...action.payload
      };
    default:
      return state;
  }
};

export default dragDropReducer;
