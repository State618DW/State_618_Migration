# RZN-618 Migration - Updated Files

1. Keep all files in this folder together. Do not rename app.js, config.js, apply.html, admin.html, or translate.js.
2. Open index.html to view the landing page, apply.html for the application form, and admin.html for the admin page.
3. Open config.js to confirm the Supabase URL/key and admin email. The publishable key is intended for browser use; never put a service_role key in frontend files.
4. In Supabase SQL Editor, review and run SUPABASE_SETUP.sql. Back up data first. It changes the power fields to text to allow values like 250M.
5. The admin must be created in Supabase Authentication and assigned app_metadata role = admin securely from the Supabase dashboard/server side. The config values alone do not create or authorize the admin.
6. For browser testing, serve the folder using a local web server (for example VS Code Live Server) rather than opening files in a way that blocks requests.
