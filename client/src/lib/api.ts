const API_BASE_URL = "http://localhost:5023/api";

export const api = {
    register: {
        options: async (username: string, authenticatorAttachment?: "platform" | "cross-platform") => {
            const res = await fetch(`${API_BASE_URL}/passkey/register/options`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, authenticatorAttachment }),
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        verify: async (response: any) => {
            const res = await fetch(`${API_BASE_URL}/passkey/register/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response),
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
    },
    login: {
        options: async (username: string) => {
            const res = await fetch(`${API_BASE_URL}/passkey/login/options`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        verify: async (response: any) => {
            const res = await fetch(`${API_BASE_URL}/passkey/login/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response),
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
    },
};
