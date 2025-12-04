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
        addLog("開始初始化...");

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

            addLog(`正在使用 Client ID 初始化 MSAL: ${config.clientId}...`);
            addLog(`授權單位 (Authority): ${msalConfig.auth.authority}`);
            addLog(`重新導向 URI (Redirect URI): ${msalConfig.auth.redirectUri}`);

            // 2. Initialize PCA
            const pca = new PublicClientApplication(msalConfig);
            await pca.initialize();
            addLog("PublicClientApplication 初始化成功。");

            // 3. Trigger Login
            addLog("正在觸發彈出視窗登入...");
            const loginRequest = {
                scopes: ["User.Read"],
            };

            const result = await pca.loginPopup(loginRequest);

            // 4. Success
            addLog("登入成功！");
            addLog(`使用者: ${result.account?.name} (${result.account?.username})`);
            addLog(`租戶 ID (Tenant ID): ${result.tenantId}`);

            setUser(result.account);

        } catch (error: any) {
            console.error(error);
            addLog(`錯誤: ${error.message}`);
            if (error.message.includes("redirect_uri_mismatch")) {
                addLog(`提示: 您需要將 '${window.location.origin}' 加入到您的 Azure 入口網站 > 應用程式註冊 > 驗證 > 重新導向 URI (SPA)。`);
            } else if (error.message.includes("9002326")) {
                addLog(`提示: 這是常見錯誤。請確認您在 Azure 入口網站的「驗證 (Authentication)」設定中，是新增「單頁應用程式 (SPA)」平台，而不是「Web」平台。`);
                addLog(`請刪除現有的 Web 平台設定，並新增 SPA 平台，將 Redirect URI 設為 ${window.location.origin}`);
            } else if (error.message.includes("50020")) {
                addLog(`提示: 您的帳戶 (Personal) 不在此租戶中。`);
                addLog(`1. 請確認 Azure Portal 支援帳戶類型是否包含「個人 Microsoft 帳戶」。`);
                addLog(`2. 如果您使用個人帳戶登入，請將下方的 Tenant ID 欄位改為 "common"，不要使用特定的 GUID。`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="space-y-4">
                <h1 className="text-3xl font-bold text-blue-400">Entra ID 遊樂場</h1>
                <p className="text-gray-400">
                    測試您的 Microsoft 應用程式註冊登入流程。
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <InstructionCard
                        title="需要設定 (Configuration Required)"
                        description="請輸入您從 Azure 入口網站取得的應用程式資訊。"
                        type="info"
                        prerequisites={[
                            "一個 Azure 應用程式註冊 (App Registration)",
                            "設定平台: 前往 [驗證 (Authentication)] > [新增平台] > [單頁應用程式 (SPA)]",
                            "設定帳戶類型: [驗證] > [支援的帳戶類型] > 選擇 [任何組織目錄...和個人 Microsoft 帳戶]",
                            "取得 clientId: [概觀 (Overview)] > 應用程式 (用戶端) 識別碼",
                            "取得 tenantId: 個人帳戶請填 'common'，組織帳戶可填 [概觀] 中的目錄識別碼",
                            `重新導向 URI: ${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}`
                        ]}
                    />

                    <DynamicConfigForm
                        title="Entra ID 設定 (Config)"
                        description="請在此貼上您的設定 JSON。"
                        placeholder={`{
  "clientId": "YOUR_CLIENT_ID",
  "tenantId": "YOUR_TENANT_ID_OR_COMMON"
}`}
                        presets={[
                            {
                                label: "載入預設設定 (Load Default)",
                                value: `{
  "clientId": "",
  "tenantId": "common"
}`
                            }
                        ]}
                        onSubmit={handleInitializeAndTest}
                        isSubmitting={isSubmitting}
                    />
                </div>

                <div className="space-y-6">
                    <div className="bg-black/40 border border-white/10 rounded-xl p-6 min-h-[400px] flex flex-col">
                        <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
                            <span>執行日誌 (Execution Logs)</span>
                            {user && <span className="text-xs bg-blue-900/50 text-blue-400 px-2 py-1 rounded">已驗證 (Authenticated)</span>}
                        </h3>

                        <div className="flex-1 font-mono text-xs space-y-2 overflow-y-auto max-h-[500px]">
                            {logs.length === 0 && (
                                <div className="text-gray-600 italic text-center mt-20">
                                    等待初始化...
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
