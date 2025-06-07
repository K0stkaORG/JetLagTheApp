import { env } from "~/lib/env";
import { toast } from "sonner-native";

const TIMEOUT_MS = 10_000;

type SuccessResponse<T> = {
    success: true;
    result: "success";
    data: T;
};

type UserErrorResponse = {
    success: false;
    result: "user-error";
    error: string;
    consumeError: () => void;
};

type ServerErrorResponse = {
    success: false;
    result: "server-error";
    error: string;
    consumeError: () => void;
};

type NetworkErrorResponse = {
    success: false;
    result: "network-error";
    error: string;
    consumeError: () => void;
};

type ServerResponse<T> =
    | SuccessResponse<T>
    | UserErrorResponse
    | ServerErrorResponse
    | NetworkErrorResponse;

type Options = {
    body?: any;
    token?: string;
    timeout?: number;
};

export const useServer = async <T>(
    path: string,
    { body, token, timeout }: Options
): Promise<ServerResponse<T>> => {
    let response: ServerResponse<T>;

    try {
        const controller = new AbortController();
        setTimeout(() => {
            controller.abort();
        }, timeout ?? TIMEOUT_MS);

        const serverResponse = await fetch(env.SERVER_URL + path, {
            method: "POST",
            body: body ? JSON.stringify(body) : undefined,
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                "Content-Type": "application/json",
            },
            signal: controller.signal,
        });

        response = await serverResponse
            .json()
            .then((json) => {
                return {
                    ...json,
                    success: serverResponse.ok,
                };
            })
            .catch((error) => {
                return {
                    success: false,
                    result: "server-error",
                    error: error instanceof Error ? error.message : String(error),
                };
            });
    } catch (error) {
        response = {
            success: false,
            result: "network-error",
            error:
                error instanceof Error
                    ? error.message === "Aborted"
                        ? "Nebyla obdržena odpověď ze serveru v časovém limitu"
                        : error.message
                    : String(error),
            consumeError: () => {},
        };
    }

    switch (response.result) {
        case "user-error":
            response.consumeError = () => {
                toast.error(response.error);
            };
            break;
        case "server-error":
            response.consumeError = () => {
                toast.warning("Při zpracovávání vašeho požadavku došlo k neočekávané chybě", {
                    description: response.error,
                });
            };
            break;
        case "network-error":
            response.consumeError = () => {
                toast.warning("Při komunikaci se serverem došlo k chybě", {
                    description: response.error,
                });
            };
            break;
    }

    return response;
};
