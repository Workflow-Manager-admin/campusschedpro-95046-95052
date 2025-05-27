import { supabase } from './supabaseClient';
import { BehaviorSubject } from 'rxjs';

/**
 * Connection states for the Supabase client
 */
export const ConnectionState = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  ERROR: 'error'
};

// Initialize connection state subject
const connectionState = new BehaviorSubject(ConnectionState.CONNECTING);
let pingInterval = null;
let retryTimeout = null;
const PING_INTERVAL = 30000; // 30 seconds
const RETRY_INTERVAL = 5000; // 5 seconds
const MAX_RETRIES = 3;

let retryCount = 0;

/**
 * Checks the connection to Supabase by performing a simple query
 * @returns {Promise<boolean>} True if connected, false otherwise
 */
async function checkConnection() {
  try {
    const { data, error } = await supabase.from('health_check').select('count').single();
    if (error) {
      console.error('Connection check failed:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Connection check error:', error);
    return false;
  }
}

/**
 * Attempts to reconnect to Supabase
 * @returns {Promise<void>}
 */
async function attemptReconnect() {
  if (retryCount >= MAX_RETRIES) {
    connectionState.next(ConnectionState.ERROR);
    console.error('Max reconnection attempts reached');
    return;
  }

  connectionState.next(ConnectionState.CONNECTING);
  retryCount++;

  const isConnected = await checkConnection();
  if (isConnected) {
    connectionState.next(ConnectionState.CONNECTED);
    retryCount = 0;
    startMonitoring();
  } else {
    retryTimeout = setTimeout(attemptReconnect, RETRY_INTERVAL);
  }
}

/**
 * Starts monitoring the Supabase connection
 */
export function startMonitoring() {
  // Clear any existing intervals/timeouts
  if (pingInterval) clearInterval(pingInterval);
  if (retryTimeout) clearTimeout(retryTimeout);

  // Set up regular connection checking
  pingInterval = setInterval(async () => {
    const isConnected = await checkConnection();
    if (!isConnected) {
      connectionState.next(ConnectionState.DISCONNECTED);
      attemptReconnect();
    } else {
      connectionState.next(ConnectionState.CONNECTED);
    }
  }, PING_INTERVAL);

  // Initial connection check
  checkConnection().then(isConnected => {
    connectionState.next(isConnected ? ConnectionState.CONNECTED : ConnectionState.DISCONNECTED);
    if (!isConnected) attemptReconnect();
  });
}

/**
 * Stops monitoring the Supabase connection
 */
export function stopMonitoring() {
  if (pingInterval) clearInterval(pingInterval);
  if (retryTimeout) clearTimeout(retryTimeout);
}

/**
 * Returns the current connection state as an observable
 * @returns {BehaviorSubject<string>} Observable of the connection state
 */
export function getConnectionState() {
  return connectionState;
}

/**
 * Returns the current connection state value
 * @returns {string} Current connection state
 */
export function getCurrentConnectionState() {
  return connectionState.getValue();
}
