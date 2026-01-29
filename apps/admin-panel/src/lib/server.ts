import { getToken } from "./auth";
import { toast } from "sonner";

const isDevelopment = import.meta.env.DEV;

export async function useServer<Request, Response>({
	method = "POST",
	path,
	data,
	anonymous = false,
}: {
	method?: "GET" | "POST";
	path: string;
	data?: Request;
	anonymous?: boolean;
}): Promise<
	| {
			result: "success";
			data: Response;
	  }
	| {
			result: "user-error";
			error: string;
	  }
	| {
			result: "error";
			error: string;
	  }
> {
	try {
		const response = await fetch(`${isDevelopment ? "http://localhost:3000" : ""}/api/admin${path}`, {
			method,
			headers: {
				"Content-Type": "application/json",
				...(anonymous ? {} : { Authorization: `Bearer ${getToken()}` }),
			},
			body: method === "POST" ? JSON.stringify(data) : undefined,
		});

		switch (response.status) {
			case 200:
				return {
					result: "success",
					data: (await response.json()) as Response,
				};

			case 400:
				const errorText = await response.text();
				toast.warning(errorText);
				return {
					result: "user-error",
					error: errorText,
				};

			default:
				throw new Error(`Request failed with status ${response.status}`);
		}
	} catch (error) {
		toast.error("An unexpected error occurred", { description: String(error) });

		return {
			result: "error",
			error: String(error),
		};
	}
}
