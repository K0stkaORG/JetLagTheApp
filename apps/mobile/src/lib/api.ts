import type { GetDatasetResponse, LobbyListResponse, LoginResponse, RevalidateResponse } from "@jetlag/shared-types";

export class APIError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message);
		this.name = "APIError";
	}
}

class APIClient {
	constructor(private baseUrl: string) {
		this.baseUrl = baseUrl.replace(/\/$/, "");
	}

	private async fetch(path: string, options: RequestInit = {}): Promise<unknown> {
		const url = `${this.baseUrl}${path}`;
		const headers = new Headers(options.headers);
		if (options.body && !headers.has("Content-Type")) {
			headers.set("Content-Type", "application/json");
		}
		const response = await fetch(url, {
			...options,
			headers,
		});

		const data = (await response.json().catch(() => null)) as { message?: string; status?: string } | null;

		if (!response.ok) {
			throw new APIError(response.status, data?.message || `HTTP ${response.status}`);
		}

		return data;
	}

	async login(nickname: string, password: string): Promise<LoginResponse> {
		return this.fetch("/api/auth/login", {
			method: "POST",
			body: JSON.stringify({ nickname, password }),
		}) as Promise<LoginResponse>;
	}

	async register(nickname: string, password: string): Promise<void> {
		return this.fetch("/api/auth/register", {
			method: "POST",
			body: JSON.stringify({ nickname, password }),
		}) as Promise<void>;
	}

	async revalidate(token: string): Promise<RevalidateResponse> {
		return this.fetch("/api/auth/revalidate", {
			method: "GET",
			headers: { Authorization: `Bearer ${token}` },
		}) as Promise<RevalidateResponse>;
	}

	async getLobby(token: string): Promise<LobbyListResponse> {
		return this.fetch("/api/lobby", {
			method: "GET",
			headers: { Authorization: `Bearer ${token}` },
		}) as Promise<LobbyListResponse>;
	}

	async getDataset(token: string, datasetId: number): Promise<GetDatasetResponse> {
		return this.fetch("/api/dataset", {
			method: "POST",
			headers: { Authorization: `Bearer ${token}` },
			body: JSON.stringify({ datasetId }),
		}) as Promise<GetDatasetResponse>;
	}

	async healthCheck(): Promise<{ isJetlagServer: true }> {
		const response = (await this.fetch("/api/isJetlagServer")) as { isJetlagServer?: boolean };
		if (response.isJetlagServer !== true) throw new APIError(400, "This is not a JetLag server");
		return response as { isJetlagServer: true };
	}
}

export function createAPIClient(baseUrl: string): APIClient {
	return new APIClient(baseUrl);
}
