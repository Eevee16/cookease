import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://nrorypixaucxuoculxta.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yb3J5cGl4YXVjeHVvY3VseHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0ODgxOTcsImV4cCI6MjA4NTA2NDE5N30.BW-Nh1AX2vqdg8OdsVEenl3f4eJ1s3iQC4C64pIC7z8'
)
