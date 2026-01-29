import { getToken } from "./auth";
import { toast } from "sonner";

const isDevelopment = import.meta.env.DEV;

export async function useServer<Request, Response>({
	method = "POST",
	path,
	data,
	anonymous = false,
	showPendingToast = true,
	onSuccess,
	voidResponse = false,
}: {
	method?: "GET" | "POST";
	path: string;
	data?: Request;
	anonymous?: boolean;
	showPendingToast?: boolean;
	onSuccess?: () => void;
	voidResponse?: boolean;
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
	try {
		const pendingToastId = showPendingToast ? toast.loading("Loading...", { duration: 0 }) : null;

		const response = await fetch(`${isDevelopment ? "http://localhost:3000" : ""}/api/admin${path}`, {
			method,
			headers: {
				"Content-Type": "application/json",
				...(anonymous ? {} : { Authorization: `Bearer ${getToken()}` }),
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

			case 400:
				const errorText = await response.json();
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
