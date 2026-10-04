-- The backend uses a private database connection; browser clients use NestJS.
-- RLS denies direct Supabase Data API access without granting public policies.
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE api_role text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON TABLE reports, report_confirmations, schema_migrations FROM %I', api_role);
    END IF;
  END LOOP;
END $$;
