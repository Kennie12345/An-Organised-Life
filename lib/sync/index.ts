// Sync engine: local IndexedDB → Supabase
// Reads sync_queue, writes to Supabase, clears queue on success
// Also handles session-start conflict detection
// See /docs/06-tech-stack.md (Sync strategy)
