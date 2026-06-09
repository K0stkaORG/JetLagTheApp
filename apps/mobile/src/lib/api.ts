import type { LoginResponse, LobbyListResponse, RegisterResponse, RevalidateResponse, User } from "@jetlag/shared-types";

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

	async register(nickname: string, password: string): Promise<RegisterResponse> {
		return this.fetch("/api/auth/register", {
			method: "POST",
			body: JSON.stringify({ nickname, password }),
		}) as Promise<RegisterResponse>;
	}

	async revalidate(token: string): Promise<RevalidateResponse> {
		return this.fetch("/api/auth/revalidate", {
			method: "POST",
			headers: { Authorization: `Bearer ${token}` },
		}) as Promise<RevalidateResponse>;
	}

	async getLobby(token: string): Promise<LobbyListResponse> {
		return this.fetch("/api/lobby/list", {
			method: "POST",
			headers: { Authorization: `Bearer ${token}` },
		}) as Promise<LobbyListResponse>;
	}

	async healthCheck(): Promise<{ status: string }> {
		return this.fetch("/health") as Promise<{ status: string }>;
	}
}

export function createAPIClient(baseUrl: string): APIClient {
	return new APIClient(baseUrl);
}
