"use client";

import { useState } from "react";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { api } from "@/lib/api";
import { InstructionCard } from "@/components/InstructionCard";
import { CredentialList } from "@/components/CredentialList";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function RoamingPage() {
    const [username, setUsername] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const handleRegister = async () => {
        if (!username) return;
        setStatus("loading");
        setMessage("");
        setLogs([]);
        addLog("開始註冊流程 (Roaming)...");

        try {
            // 1. Get Options
            addLog("向伺服器請求註冊選項 (Options)...");
            // Force cross-platform authenticator
            const options = await api.register.options(username, "cross-platform");
            addLog("取得選項: " + JSON.stringify(options));

            // 2. Start Registration (Browser)
            addLog("呼叫瀏覽器 WebAuthn API (startRegistration)...");
            addLog("請插入您的安全金鑰或準備掃描 QR Code...");
            const attResp = await startRegistration(options);
            addLog("瀏覽器回應: " + JSON.stringify(attResp));

            // 3. Verify
            addLog("傳送回應至伺服器驗證...");
            const verificationResp = await api.register.verify(attResp);
            addLog("驗證結果: " + JSON.stringify(verificationResp));

            // If we get here, it means HTTP 200 OK
            setStatus("success");
            setMessage("註冊成功！您現在可以使用此 Roaming Passkey 登入。");

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
            addLog("請插入您的安全金鑰或準備手機...");
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
                <h1 className="text-3xl font-bold text-slate-100">Roaming Authenticator</h1>
                <p className="mt-2 text-slate-400">
                    測試跨裝置的 Passkey (例如 YubiKey, 手機)。
                </p>
            </div>

            <InstructionCard
                title="測試說明"
                description="此頁面將強制要求使用「漫遊驗證器 (Cross-Platform)」。這通常是 USB 安全金鑰或另一台手機。"
                prerequisites={[
                    "YubiKey 或其他 FIDO2 安全金鑰",
                    "或支援 Passkey 的手機 (需開啟藍牙/掃描 QR Code)",
                    "電腦需有藍牙功能 (若使用手機驗證)"
                ]}
                steps={[
                    "輸入使用者名稱 (例如 roaming_user)",
                    "點擊「註冊 Passkey」",
                    "瀏覽器將提示您插入金鑰或使用手機",
                    "完成驗證後，點擊「使用 Passkey 登入」測試登入流程",
                ]}
                type="warning"
            />

            <div className="grid lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-xl border shadow-sm h-fit">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                使用者名稱
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                                placeholder="輸入名稱..."
                            />
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={handleRegister}
                                disabled={status === "loading" || !username}
                                className="flex-1 bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 disabled:opacity-50 transition-colors"
                            >
                                {status === "loading" ? <Loader2 className="animate-spin mx-auto" /> : "註冊 Roaming Passkey"}
                            </button>
                            <button
                                onClick={handleLogin}
                                disabled={status === "loading" || !username}
                                className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 px-4 rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors"
                            >
                                使用 Passkey 登入
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
                    <CredentialList />

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
