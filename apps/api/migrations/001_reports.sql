CREATE EXTENSION IF NOT EXISTS postgis;
CREATE TABLE reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 country_code varchar(2) NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
 category varchar(24) NOT NULL CHECK (category IN ('road','flood','accident','weather','infrastructure','other')),
 title varchar(120) NOT NULL CHECK (char_length(title) BETWEEN 5 AND 120),
 description varchar(1500),
 location geography(Point,4326) NOT NULL,
 confirmations integer NOT NULL DEFAULT 0 CHECK (confirmations >= 0),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reports_location_idx ON reports USING gist((location::geometry));
CREATE INDEX reports_country_category_created_idx ON reports(country_code,category,created_at DESC);
CREATE TABLE report_confirmations (
 report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
 actor_hash char(64) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (report_id,actor_hash)
);
