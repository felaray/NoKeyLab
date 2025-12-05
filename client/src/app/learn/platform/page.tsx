"use client";

import { useState } from "react";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { api } from "@/lib/api";
import { InstructionCard } from "@/components/InstructionCard";
import { CredentialList } from "@/components/CredentialList";
import Link from "next/link";
import { Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react";

export default function PlatformPage() {
    const [username, setUsername] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const [logs, setLogs] = useState<string[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const addLog = (msg: string) => setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const handleRegister = async () => {
        if (!username) return;
        setStatus("loading");
        setMessage("");
        setLogs([]);
        addLog("開始註冊流程...");

        try {
            // 1. Get Options
            addLog("向伺服器請求註冊選項 (Options)...");
            const options = await api.register.options(username, "platform");
            addLog("取得選項: " + JSON.stringify(options));

            // 2. Start Registration (Browser)
            addLog("呼叫瀏覽器 WebAuthn API (startRegistration)...");
            const attResp = await startRegistration(options);
            addLog("瀏覽器回應: " + JSON.stringify(attResp));

            // 3. Verify
            addLog("傳送回應至伺服器驗證...");
            const verificationResp = await api.register.verify(attResp, "platform");
            addLog("驗證結果: " + JSON.stringify(verificationResp));

            // If we get here, it means HTTP 200 OK
            setStatus("success");
            setMessage("註冊成功！您現在可以使用此 Passkey 登入。");
            setRefreshTrigger(prev => prev + 1);

        } catch (error: any) {
            console.error(error);
            setStatus("error");
            setMessage(error.message || "發生錯誤");
            addLog("錯誤: " + error.message);
        }
    };

    const handleLogin = async () => {
        if (!username) return;
        setStatus("loading");
        setMessage("");
        setLogs([]);
        addLog("開始登入流程...");

        try {
            // 1. Get Options
            addLog("向伺服器請求登入選項 (Options)...");
            const options = await api.login.options(username);
            addLog("取得選項: " + JSON.stringify(options));

            // 2. Start Authentication (Browser)
            addLog("呼叫瀏覽器 WebAuthn API (startAuthentication)...");
            const asseResp = await startAuthentication(options);
            addLog("瀏覽器回應: " + JSON.stringify(asseResp));

            // 3. Verify
            addLog("傳送回應至伺服器驗證...");
            const verificationResp = await api.login.verify(asseResp);
            addLog("驗證結果: " + JSON.stringify(verificationResp));

            // If we get here, it means HTTP 200 OK
            setStatus("success");
            setMessage("登入成功！");

        } catch (error: any) {
            console.error(error);
            setStatus("error");
            setMessage(error.message || "發生錯誤");
            addLog("錯誤: " + error.message);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <Link href="/learn" className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    回到機制探索
                </Link>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Platform Authenticator</h1>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                    測試綁定裝置的 Passkey (例如 Windows Hello, TouchID)。
                </p>
            </div>

            <InstructionCard
                title="測試說明"
                description="此頁面將強制要求使用「本機驗證器」。請確保您的裝置支援生物辨識或已設定 PIN 碼。"
                prerequisites={["Windows Hello (PIN/臉部/指紋) 或 TouchID/FaceID", "不支援跨裝置 (Roaming)"]}
                steps={[
                    "輸入使用者名稱 (例如 testuser)",
                    "點擊「註冊 Passkey」",
                    "依照系統提示完成驗證",
                    "點擊「使用 Passkey 登入」測試登入流程",
                ]}
                type="info"
            />

            <div className="grid lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                使用者名稱
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 text-lg border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white dark:bg-slate-800 placeholder:text-slate-400"
                                placeholder="輸入名稱..."
                            />
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleRegister}
                                disabled={status === "loading" || !username}
                                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg text-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm hover:shadow"
                            >
                                {status === "loading" ? <Loader2 className="animate-spin mx-auto" /> : "註冊 Passkey"}
                            </button>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-md flex items-center gap-2 ${status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {status === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                {message}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <CredentialList
                        refreshTrigger={refreshTrigger}
                        filterType="platform"
                        onLog={addLog}
                    />

                    {logs.length > 0 && (
                        <div className="bg-slate-900 text-slate-200 p-6 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800">
                            <h3 className="text-slate-400 font-bold mb-2 uppercase tracking-wider">Debug Logs</h3>
                            <div className="space-y-1">
                                {logs.map((log, i) => (
                                    <div key={i} className="whitespace-pre-wrap">{log}</div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
