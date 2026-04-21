import { createBrowserClient } from "@supabase/ssr"

export const supabase = createBrowserClient(
    "https://cridqhqgqfbvxcwsplec.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyaWRxaHFncWZidnhjd3NwbGVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDIwOTAsImV4cCI6MjA3MTQ3ODA5MH0.q7iEQP9vXArLpKQRzrUI8Ty2eWrba96evABuFBD8h8c"
)