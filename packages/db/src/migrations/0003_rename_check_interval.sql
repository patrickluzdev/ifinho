DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scrape_configs' AND column_name = 'check_every_hours'
  ) THEN
    ALTER TABLE scrape_configs RENAME COLUMN check_every_hours TO check_interval_minutes;
  END IF;
END $$;
