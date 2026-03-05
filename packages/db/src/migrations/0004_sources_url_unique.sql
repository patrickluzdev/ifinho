CREATE UNIQUE INDEX IF NOT EXISTS sources_url_unique ON sources (url) WHERE url IS NOT NULL;
