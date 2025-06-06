import { env } from "~/lib/env";
import { toast } from "sonner-native";

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

export const useServer = async <T>(path: string, data: any): Promise<ServerResponse<T>> => {
    let response: ServerResponse<T>;

    try {
        const serverResponse = await fetch(env.SERVER_URL + path, {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
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
            error: error instanceof Error ? error.message : String(error),
            consumeError: () => null,
        };
    }

    switch (response.result) {
        case "user-error":
            response.consumeError = () => toast.error(response.error);
            break;
        case "server-error":
            response.consumeError = () =>
                toast.warning("Při zpracovávání vašeho požadavku došlo k neočekávané chybě", {
                    description: response.error,
                });
            break;
        case "network-error":
            response.consumeError = () =>
                toast.warning("Při komunikaci se serverem došlo k chybě", {
                    description: response.error,
                });
            break;
    }

    return response;
};
