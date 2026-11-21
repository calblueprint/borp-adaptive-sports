-- Columns for trails imported from OpenStreetMap (scripts/sync-osm-trail.ts).
-- All nullable, so trails added by hand in the app are unaffected.
alter table public.sites
  add column osm_type text check (osm_type in ('way', 'relation')),
  add column osm_id bigint,
  -- The trail's shape: an array of segments, each an array of [lat, lng] pairs
  add column geometry jsonb,
  -- Raw OSM tags, kept so new fields can be pulled out later without refetching
  add column osm_tags jsonb,
  add column osm_synced_at timestamptz;

-- Lets the sync script update a trail it already imported instead of duplicating it.
-- Rows without an OSM id (null) never conflict with each other.
alter table public.sites
  add constraint sites_osm_type_osm_id_key unique (osm_type, osm_id);

-- The sync script connects as service_role. It bypasses row-level security but
-- still needs table privileges: insert/update for the upsert, select to return the row.
grant select, insert, update on public.sites to service_role;
