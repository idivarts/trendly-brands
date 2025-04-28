import { AuthApp } from "./auth";

const BASE_URL = 'https://be.trendly.now';
export class HttpWrapper {
    public static fetch = async (urlPath: string, init?: RequestInit): Promise<Response> => {
        let idToken = ""
        if (AuthApp.currentUser) {
            idToken = await AuthApp.currentUser.getIdToken();
        }
        const response = await fetch(BASE_URL + urlPath, {
            ...init,
            headers: {
                ...init?.headers,
                ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
            },
        });
        if (response.status >= 300) {
            throw response;
        }
        return response
    }
}
export { BASE_URL as BACKEND_URL };
