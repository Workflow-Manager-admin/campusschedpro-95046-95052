import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import dragDropReducer from './reducers/dragDropReducer';

// Combine all reducers
const rootReducer = combineReducers({
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

// Setup Redux DevTools
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

// Create store with middleware
const store = createStore(
  rootReducer,
  composeEnhancers(
    applyMiddleware(logger)
  )
);

export default store;
