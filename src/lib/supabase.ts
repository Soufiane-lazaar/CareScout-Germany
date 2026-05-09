import { createClient } from '@supabase/supabase-js';

const hardcodedUrl = 'https://pcifkfpwtaaioovlwujr.supabase.co';
const hardcodedAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjaWZrZnB3dGFhaW9vdmx3dWpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMjg1ODIsImV4cCI6MjA5MzgwNDU4Mn0.tyCHO4aoolN5QGUu7f8vMQSTkIlfQLdxa6PZpFipars';

// Get environment variables
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if a key is a service_role key (which is forbidden in browsers)
const isServiceRole = (key: string | undefined): boolean => {
  if (!key || typeof key !== 'string') return false;
  try {
    const parts = key.split('.');
    if (parts.length !== 3) return false;
    // Decode base64url
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    const payload = JSON.parse(jsonPayload);
    return payload.role === 'service_role';
  } catch (e) {
    return false;
  }
};

// Check for placeholders or missing values
const isPlaceholder = (val: string | undefined) => 
  !val || val.includes('your-project-id') || val.includes('your-anon-key');

// Determine final values with aggressive fallback
const finalUrl = isPlaceholder(envUrl) ? hardcodedUrl : envUrl!;
let finalKey = isPlaceholder(envKey) ? hardcodedAnonKey : envKey!;

if (isServiceRole(finalKey)) {
  console.warn("Detected 'service_role' key. Automatically switching to standard 'anon' key for security and functionality.");
  finalKey = hardcodedAnonKey;
}

export const supabase = createClient(finalUrl, finalKey);

console.log("Supabase initialized with " + (finalUrl === hardcodedUrl ? "embedded" : "environment") + " configuration.");
