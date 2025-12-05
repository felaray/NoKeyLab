const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
const API_KEY = "nopassword";

const headers = {
    "Content-Type": "application/json",
    "X-Api-Key": API_KEY
};

export const api = {
    register: {
        options: async (username: string, authenticatorAttachment?: "platform" | "cross-platform") => {
            const res = await fetch(`${API_BASE_URL}/passkey/register/options`, {
                method: "POST",
                headers: headers,
                body: JSON.stringify({ username, authenticatorAttachment }),
                credentials: "include",
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        verify: async (response: any, authenticatorAttachment?: string) => {
            const res = await fetch(`${API_BASE_URL}/passkey/register/verify`, {
                method: "POST",
                headers: headers,
                body: JSON.stringify({ response, authenticatorAttachment }),
                credentials: "include",
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
    },
    login: {
        options: async (username: string = "") => {
            const res = await fetch(`${API_BASE_URL}/passkey/login/options`, {
                method: "POST",
                headers: headers,
                body: JSON.stringify({ username }),
                credentials: "include",
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        verify: async (response: any) => {
            const res = await fetch(`${API_BASE_URL}/passkey/login/verify`, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(response),
                credentials: "include",
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
    },
    credentials: {
        list: async (type?: string) => {
            const url = type
                ? `${API_BASE_URL}/passkey/credentials?type=${type}`
                : `${API_BASE_URL}/passkey/credentials`;
            const res = await fetch(url, {
                method: "GET",
                headers: headers,
                credentials: "include",
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        delete: async (credentialId: string) => {
            const res = await fetch(`${API_BASE_URL}/passkey/credentials/${credentialId}`, {
                method: "DELETE",
                headers: headers,
                credentials: "include",
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        }
    }
};
