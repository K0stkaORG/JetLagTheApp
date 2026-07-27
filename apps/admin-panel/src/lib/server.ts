import { toast } from "sonner";
import { getToken } from "./auth";

const isDevelopment = import.meta.env.DEV;

export const SERVER_API_BASE = isDevelopment ? "http://localhost:3000" : "";

export async function useServer<Request, Response>({
	method = "POST",
	path,
	data,
	anonymous = false,
	showPendingToast = true,
	onSuccess,
	voidResponse = false,
	token,
}: {
	method?: "GET" | "POST";
	path: string;
	data?: Request;
	anonymous?: boolean;
	showPendingToast?: boolean;
	onSuccess?: () => void;
	voidResponse?: boolean;
	token?: string;
}): Promise<
	| {
			result: "success";
			data: typeof voidResponse extends true ? undefined : Response;
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
	const pendingToastId = showPendingToast ? toast.loading("Loading...", { duration: 0 }) : null;

	try {
		const response = await fetch(`${SERVER_API_BASE}/api/admin${path}`, {
			method,
			headers: {
				"Content-Type": "application/json",
				...(anonymous ? {} : { Authorization: `Bearer ${token ?? getToken()}` }),
			},
			body: method === "POST" ? JSON.stringify(data) : undefined,
		});

		if (pendingToastId) toast.dismiss(pendingToastId);

		switch (response.status) {
			case 200:
				if (onSuccess) onSuccess();

				return {
					result: "success",
					data: (voidResponse
						? undefined
						: ((await response.json()) as Response)) as typeof voidResponse extends true
						? undefined
						: Response,
				};

			case 400: {
				const { message: errorText } = await response.json();
				toast.warning(errorText);
				return {
					result: "user-error",
					error: errorText,
				};
			}

			default:
				throw new Error(`Request failed with status ${response.status}`);
		}
	} catch (error) {
		if (pendingToastId) toast.dismiss(pendingToastId);

		if ((error as Error)?.message === "Failed to fetch") {
			toast.error("Failed to fetch", { description: "The server could not be reached" });

			return {
				result: "error",
				error: "Failed to fetch",
			};
		}

		toast.error("An unexpected error occurred", { description: String(error) });

		return {
			result: "error",
			error: String(error),
		};
	}
}
