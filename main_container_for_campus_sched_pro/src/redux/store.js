import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import studentReducer from './reducers/studentReducer';
import dragDropReducer from './reducers/dragDropReducer';

// Combine all reducers
const rootReducer = combineReducers({
  student: studentReducer,
  dragDrop: dragDropReducer,
  // Add other reducers here as the app grows
  ui: (state = { selectedTab: null, darkMode: false }, action) => {
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
  }
});

// Simple logging middleware for debugging (can be removed in production)
const logger = store => next => action => {
  if (process.env.NODE_ENV !== 'production') {
    console.group(action.type);
    console.info('dispatching', action);
    const result = next(action);
    console.log('next state', store.getState());
    console.groupEnd();
    return result;
  }
  return next(action);
};

// Create store
const store = createStore(
  rootReducer,
  // Enable Redux DevTools Extension if available
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

export default store;
