import { env } from "@ifinho/env/server";
import { Worker } from "bullmq";

export const chatWorker = new Worker(
	"chat",
	async (job) => {
		console.log(`Processando mensagem: ${job.data.message}`);

		// Aqui vai entrar futuramente:
		// 1. Buscar no banco vetorial (RAG)
		// 2. Mandar pra IA
		// 3. Retornar a resposta
	},
	{
		connection: {
			url: env.REDIS_URL,
		},
	},
);

chatWorker.on("completed", (job) => {
	console.log(`Mensagem ${job.id} processada com sucesso!`);
});

chatWorker.on("failed", (job, error) => {
	console.log(`Mensagem ${job?.id} falhou: ${error.message}`);
});
