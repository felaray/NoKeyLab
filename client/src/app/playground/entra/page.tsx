"use client";

import { useState } from "react";
import { DynamicConfigForm } from "@/components/DynamicConfigForm";
import { InstructionCard } from "@/components/InstructionCard";
import { PublicClientApplication } from "@azure/msal-browser";
import { User } from "lucide-react";

export default function EntraPlayground() {
    const [logs, setLogs] = useState<string[]>([]);
    const [user, setUser] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addLog = (msg: string) => setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const handleInitializeAndTest = async (config: any) => {
        setIsSubmitting(true);
        setLogs([]);
        setUser(null);
        addLog("Starting initialization...");

        try {
            // 1. Construct MSAL Config
            const msalConfig = {
                auth: {
                    clientId: config.clientId,
                    authority: config.tenantId
                        ? `https://login.microsoftonline.com/${config.tenantId}`
                        : "https://login.microsoftonline.com/common",
                    redirectUri: window.location.origin, // Dynamic redirect URI
                },
                cache: {
                    cacheLocation: "sessionStorage",
                    storeAuthStateInCookie: false,
                }
            };

            addLog(`Initializing MSAL with Client ID: ${config.clientId}...`);
            addLog(`Authority: ${msalConfig.auth.authority}`);
            addLog(`Redirect URI: ${msalConfig.auth.redirectUri}`);

            // 2. Initialize PCA
            const pca = new PublicClientApplication(msalConfig);
            await pca.initialize();
            addLog("PublicClientApplication initialized successfully.");

            // 3. Trigger Login
            addLog("Triggering Popup Login...");
            const loginRequest = {
                scopes: ["User.Read"],
            };

            const result = await pca.loginPopup(loginRequest);

            // 4. Success
            addLog("Login Successful!");
            addLog(`User: ${result.account?.name} (${result.account?.username})`);
            addLog(`Tenant ID: ${result.tenantId}`);

            setUser(result.account);

        } catch (error: any) {
            console.error(error);
            addLog(`ERROR: ${error.message}`);
            if (error.message.includes("redirect_uri_mismatch")) {
                addLog(`HINT: You need to add '${window.location.origin}' to your App Registration > Authentication > Redirect URIs (SPA) in Azure Portal.`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="space-y-4">
                <h1 className="text-3xl font-bold text-blue-400">Entra ID Playground</h1>
                <p className="text-gray-400">
                    Test your Microsoft App Registration login flow.
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <InstructionCard
                        title="Configuration Required"
                        description="Enter your Application (client) ID and Directory (tenant) ID from Azure Portal."
                        type="info"
                        prerequisites={[
                            "An Azure App Registration",
                            "Platform: Single-page application (SPA)",
                            `Redirect URI: ${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}`
                        ]}
                    />

                    <DynamicConfigForm
                        title="Entra ID Config"
                        description="Paste your config JSON here."
                        placeholder={`{
  "clientId": "YOUR_CLIENT_ID",
  "tenantId": "YOUR_TENANT_ID_OR_COMMON"
}`}
                        onSubmit={handleInitializeAndTest}
                        isSubmitting={isSubmitting}
                    />
                </div>

                <div className="space-y-6">
                    <div className="bg-black/40 border border-white/10 rounded-xl p-6 min-h-[400px] flex flex-col">
                        <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
                            <span>Execution Logs</span>
                            {user && <span className="text-xs bg-blue-900/50 text-blue-400 px-2 py-1 rounded">Authenticated</span>}
                        </h3>

                        <div className="flex-1 font-mono text-xs space-y-2 overflow-y-auto max-h-[500px]">
                            {logs.length === 0 && (
                                <div className="text-gray-600 italic text-center mt-20">
                                    Waiting for initialization...
                                </div>
                            )}
                            {logs.map((log, i) => (
                                <div key={i} className={log.includes("ERROR") ? "text-red-400" : "text-gray-300"}>
                                    {log}
                                </div>
                            ))}
                        </div>
                    </div>

                    {user && (
                        <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-blue-100">{user.name}</h4>
                                    <p className="text-sm text-blue-300/70">{user.username}</p>
                                    <p className="text-xs text-blue-300/50 mt-1 font-mono">Tenant: {user.tenantId}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
