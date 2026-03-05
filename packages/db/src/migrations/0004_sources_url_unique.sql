DROP INDEX IF EXISTS sources_url_unique;
CREATE UNIQUE INDEX IF NOT EXISTS sources_url_unique ON sources (url);
