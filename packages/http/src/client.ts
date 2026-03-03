export function createClient(baseUrl: string) {
	return {
		async get<T>(path: string): Promise<T> {
			const res = await fetch(`${baseUrl}${path}`);
			if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`);
			return res.json() as Promise<T>;
		},

		async post<TBody, TRes>(path: string, body: TBody): Promise<TRes> {
			const res = await fetch(`${baseUrl}${path}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`);
			return res.json() as Promise<TRes>;
		},
	};
}
