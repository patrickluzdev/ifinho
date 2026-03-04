import { env } from "@ifinho/env/server";
import { Queue } from "bullmq";

export const chatQueue = new Queue("chat", {
	connection: {
		url: env.REDIS_URL,
	},
});
