import "dotenv/config";
import { env } from "@ifinho/env/server";
import PgBoss from "pg-boss";

export interface ScrapeJobData {
	pluginId: string;
	configId: string;
}

let instance: PgBoss | null = null;

export async function getPgBoss(): Promise<PgBoss> {
	if (instance) return instance;

	instance = new PgBoss({
		connectionString: env.DATABASE_URL,
		max: 5,
	});

	await instance.start();
	return instance;
}

export { PgBoss };
