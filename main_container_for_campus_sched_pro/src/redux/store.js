import { configureStore } from 'redux';
import studentReducer from './reducers/studentReducer';
import dragDropReducer from './reducers/dragDropReducer';

// UI reducer as a slice
const uiReducer = (state = { selectedTab: null, darkMode: false }, action) => {
  switch (action.type) {
    case 'SET_SELECTED_TAB':
      return {
        ...state,
        selectedTab: action.payload
      };
    case 'TOGGLE_DARK_MODE':
      return {
        ...state,
        darkMode: !state.darkMode
      };
    default:
      return state;
  }
};

// Simple logging middleware for debugging (can be removed in production)
const logger = store => next => action => {
  // Disable console logs in CI environment
  if (process.env.NODE_ENV !== 'production' && !process.env.CI) {
    // eslint-disable-next-line no-console
    console.group(action.type);
    // eslint-disable-next-line no-console
    console.info('dispatching', action);
    const result = next(action);
    // eslint-disable-next-line no-console
    console.log('next state', store.getState());
    // eslint-disable-next-line no-console
    console.groupEnd();
    return result;
  }
  return next(action);
};

// Create store with configureStore API from Redux Toolkit
const store = configureStore({
  reducer: {
    student: studentReducer,
    dragDrop: dragDropReducer,
    ui: uiReducer
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger),
  devTools: process.env.NODE_ENV !== 'production'
});

export default store;
