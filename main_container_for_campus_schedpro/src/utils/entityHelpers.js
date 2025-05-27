//
// No localStorage usage remaining! All entity state is always sourced from Supabase.
//

// PUBLIC_INTERFACE
export function getInitialEntityState(entityType) {
  // Always return empty; entity state will be hydrated from DB.
  return [];
}

// PUBLIC_INTERFACE
export function getInitialRoomsData() {
  // Always return empty; rooms will be hydrated from DB.
  return [];
}
