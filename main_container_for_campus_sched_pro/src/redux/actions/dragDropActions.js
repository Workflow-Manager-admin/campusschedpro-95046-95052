import { DRAG_START, DRAG_END, UPDATE_DRAG_STATE } from '../reducers/dragDropReducer';

// Action creators for drag-and-drop operations
export const dragStart = (dragInfo) => ({
  type: DRAG_START,
  payload: dragInfo
});

export const dragEnd = () => ({
  type: DRAG_END
});

export const updateDragState = (dragState) => ({
  type: UPDATE_DRAG_STATE,
  payload: dragState
});
