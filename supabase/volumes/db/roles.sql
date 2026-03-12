-- Set password for all Supabase service roles to match POSTGRES_PASSWORD
-- This script runs on first database initialization
\set pgpass `echo "$POSTGRES_PASSWORD"`

ALTER USER authenticator       WITH PASSWORD :'pgpass';
ALTER USER supabase_auth_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_storage_admin WITH PASSWORD :'pgpass';
