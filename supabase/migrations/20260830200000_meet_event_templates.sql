CREATE TABLE IF NOT EXISTS meet_event_templates (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organization (id) ON DELETE CASCADE,
  name text NOT NULL,
  course course NOT NULL DEFAULT 'SCY',
  events jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS meet_event_templates_org_idx
  ON meet_event_templates (organization_id);
