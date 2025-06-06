import { env } from "~/lib/env";

type SuccessResponse<T> = {
    success: true;
    result: "success";
    data: T;
};

type UserErrorResponse = {
    success: false;
    result: "user-error";
    error: string;
};

type ServerErrorResponse = {
    success: false;
    result: "server-error";
    error: string;
};

type NetworkErrorResponse = {
    success: false;
    result: "network-error";
    error: string;
};

type ServerResponse<T> =
    | SuccessResponse<T>
    | UserErrorResponse
    | ServerErrorResponse
    | NetworkErrorResponse;

export const useServer = async <T>(path: string, data: any): Promise<ServerResponse<T>> => {
    try {
        const response = await fetch(env.SERVER_URL + path, {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        });

        return await response
            .json()
            .then((json) => {
                return {
                    ...json,
                    success: response.ok,
                };
            })
            .catch((error) => {
                return {
                    success: false,
                    result: "server-error",
                    error: error instanceof Error ? error.message : "Unknown server error",
                };
            });
    } catch (error) {
        return {
            success: false,
            result: "network-error",
            error: error instanceof Error ? error.message : "Unknown network error",
        };
    }
};
