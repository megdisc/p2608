import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5eHhxdnd2dXRzcnFwb25tbGtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODU1ODYzMzgsImV4cCI6MTk5MjI5MDA3NX0.i5z3...'; // wait, I need the actual anon key.

// I can just read it from .env.local
