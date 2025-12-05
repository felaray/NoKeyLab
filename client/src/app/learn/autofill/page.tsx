"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { InstructionCard } from "@/components/InstructionCard";
import { CredentialList } from "@/components/CredentialList";
import Link from "next/link";
import { Loader2, CheckCircle, XCircle, Sparkles, UserPlus, LogIn, ArrowLeft } from "lucide-react";

export default function AutofillPage() {
    // State for Registration
    const [regUsername, setRegUsername] = useState("");
    const [regStatus, setRegStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [regMessage, setRegMessage] = useState("");

    // State for Autofill Login
    const [loginUsername, setLoginUsername] = useState(""); // Just for display/input
    const [loginStatus, setLoginStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [loginMessage, setLoginMessage] = useState("");
    const [loggedInUser, setLoggedInUser] = useState("");
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [logs, setLogs] = useState<string[]>([]);
    const abortControllerRef = useRef<AbortController | null>(null);

    const addLog = (msg: string) => setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    // Helper functions for Base64URL conversion
    const base64URLStringToBuffer = (base64URL: string) => {
        const base64 = base64URL.replace(/-/g, '+').replace(/_/g, '/');
        const padLen = (4 - (base64.length % 4)) % 4;
        const padded = base64 + '='.repeat(padLen);
        const binary = atob(padded);
        const buffer = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
        return buffer.buffer;
    };

    const bufferToBase64URLString = (buffer: ArrayBuffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    };

    const startConditionalUI = async () => {
        // Cancel any existing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new controller
        const controller = new AbortController();
        abortControllerRef.current = controller;

        // Check if browser supports conditional mediation
        if (
            PublicKeyCredential.isConditionalMediationAvailable &&
            await PublicKeyCredential.isConditionalMediationAvailable()
        ) {
            addLog("啟動 Autofill 監聽 (Conditional Mediation)...");

            try {
                const optionsJSON = await api.login.options("");

                // For Conditional Mediation (Autofill), we should NOT pass allowCredentials
                // This lets the browser show ALL discoverable credentials stored for this RP
                const publicKey: PublicKeyCredentialRequestOptions = {
                    challenge: base64URLStringToBuffer(optionsJSON.challenge),
                    rpId: optionsJSON.rpId,
                    timeout: optionsJSON.timeout,
                    userVerification: optionsJSON.userVerification as UserVerificationRequirement,
                    // Don't pass allowCredentials for autofill - browser will show discoverable credentials
                };

                // Call native API with mediation: conditional AND signal
                const cred = await navigator.credentials.get({
                    mediation: "conditional",
                    publicKey,
                    signal: controller.signal
                }) as PublicKeyCredential;

                if (!cred) throw new Error("No credential returned");

                const assertionResponse = {
                    id: cred.id,
                    rawId: bufferToBase64URLString(cred.rawId),
                    response: {
                        authenticatorData: bufferToBase64URLString((cred.response as AuthenticatorAssertionResponse).authenticatorData),
                        clientDataJSON: bufferToBase64URLString((cred.response as AuthenticatorAssertionResponse).clientDataJSON),
                        signature: bufferToBase64URLString((cred.response as AuthenticatorAssertionResponse).signature),
                        userHandle: (cred.response as AuthenticatorAssertionResponse).userHandle
                            ? bufferToBase64URLString((cred.response as AuthenticatorAssertionResponse).userHandle!)
                            : undefined,
                    },
                    type: cred.type,
                    clientExtensionResults: cred.getClientExtensionResults(),
                    authenticatorAttachment: cred.authenticatorAttachment,
                };

                addLog("收到 Autofill 選擇，正在驗證...");
                setLoginStatus("loading");

                const verificationResp = await api.login.verify(assertionResponse);
                addLog(`驗證成功: ${verificationResp.username} (裝置: ${assertionResponse.authenticatorAttachment || 'unknown'})`);

                setLoginStatus("success");
                setLoginMessage("登入成功！");
                setLoggedInUser(verificationResp.username || "Unknown User");

            } catch (error: any) {
                if (error.name === 'AbortError') {
                    addLog("Autofill 監聽已暫停 (使用者進行其他操作)");
                } else if (error.name !== 'NotAllowedError') {
                    console.error(error);
                    addLog("Autofill 錯誤: " + error.message);
                    setLoginStatus("error");
                    setLoginMessage(error.message);
                }
            }
        } else {
            addLog("您的瀏覽器不支援 Conditional Mediation。");
        }
    };

    // Start on mount (with StrictMode protection)
    useEffect(() => {
        let isCancelled = false;

        // Small delay to handle StrictMode double-mount
        const timer = setTimeout(() => {
            if (!isCancelled) {
                startConditionalUI();
            }
        }, 100);

        return () => {
            isCancelled = true;
            clearTimeout(timer);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const handleRegister = async () => {
        if (!regUsername) return;

        // 1. Abort Autofill listener to prevent "request pending" error
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        setRegStatus("loading");
        setRegMessage("");
        addLog("開始註冊流程...");

        try {
            const { startRegistration } = require("@simplewebauthn/browser");
            // Autofill requires discoverable credentials (resident key)
            const options = await api.register.options(regUsername, undefined, "required");
            const attResp = await startRegistration(options);
            await api.register.verify(attResp, attResp.authenticatorAttachment);

            setRegStatus("success");
            setRegMessage("註冊成功！");
            addLog(`註冊完成: ${regUsername} (方式: ${attResp.authenticatorAttachment || 'unknown'})`);
            setRegUsername(""); // Clear input
            setRefreshTrigger(prev => prev + 1);
        } catch (error: any) {
            setRegStatus("error");
            setRegMessage(error.message);
            addLog("註冊錯誤: " + error.message);
        } finally {
            // 2. Restart Autofill listener after registration (success or fail)
            // Give a small delay to ensure previous request is fully cleared
            setTimeout(() => {
                startConditionalUI();
            }, 500);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <Link href="/learn" className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    回到機制探索
                </Link>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    Autofill UI <Sparkles className="text-yellow-400" />
                </h1>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                    體驗最現代化的登入方式：點擊輸入框，Passkey 自動跳出。
                </p>
            </div>

            <InstructionCard
                title="測試說明"
                description="為了避免瀏覽器限制 (同一時間只能有一個 WebAuthn 請求)，我們將註冊與登入區塊分開。當您點擊「註冊」時，Autofill 監聽會暫時停止。"
                prerequisites={[
                    "瀏覽器需支援 Conditional Mediation",
                ]}
                steps={[
                    "先在左側「註冊新帳號」建立 Passkey",
                    "註冊完成後，到右側「Autofill 登入」點擊輸入框",
                    "選擇您的 Passkey 進行登入"
                ]}
                type="info"
            />

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Registration Section */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-indigo-600 dark:text-indigo-400">
                        <UserPlus className="w-5 h-5" />
                        <h2 className="text-lg font-semibold">1. 註冊新帳號</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                使用者名稱
                            </label>
                            <input
                                type="text"
                                value={regUsername}
                                onChange={(e) => setRegUsername(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white placeholder-slate-400"
                                placeholder="例如: user1"
                            />
                        </div>

                        <button
                            onClick={handleRegister}
                            disabled={regStatus === "loading" || !regUsername}
                            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            {regStatus === "loading" ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : "建立 Passkey"}
                        </button>

                        {regMessage && (
                            <div className={`p-3 rounded-md flex items-center gap-2 text-sm ${regStatus === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                {regStatus === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
                                {regMessage}
                            </div>
                        )}
                    </div>
                </div>

                {/* Login Section */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
                    <div className="flex items-center gap-2 mb-4 text-slate-800 dark:text-slate-200">
                        <LogIn className="w-5 h-5" />
                        <h2 className="text-lg font-bold">2. Autofill 登入</h2>
                    </div>

                    <div className="space-y-4">
                        <form onSubmit={(e) => e.preventDefault()}>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                點擊此處測試 Autofill
                            </label>
                            <input
                                type="text"
                                name="username"
                                autoComplete="username webauthn"
                                value={loginUsername}
                                onChange={(e) => setLoginUsername(e.target.value)}
                                className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-md focus:ring-4 focus:ring-yellow-100 dark:focus:ring-yellow-900/30 focus:border-yellow-400 outline-none text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 transition-all"
                                placeholder="點擊我喚醒 Passkey..."
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                瀏覽器會自動偵測此欄位並顯示 Passkey 選單
                            </p>
                        </form>

                        {loginMessage && (
                            <div className={`p-4 rounded-md flex items-center gap-2 ${loginStatus === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'}`}>
                                {loginStatus === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <XCircle className="w-5 h-5 flex-shrink-0" />}
                                <div>
                                    <div className="font-semibold">{loginMessage}</div>
                                    {loggedInUser && <div className="text-sm opacity-80">歡迎回來, {loggedInUser}</div>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <CredentialList refreshTrigger={refreshTrigger} showLogin={false} />

                {logs.length > 0 && (
                    <div className="bg-slate-900 text-slate-200 p-6 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 h-64">
                        <h3 className="text-slate-400 font-bold mb-2 uppercase tracking-wider sticky top-0 bg-slate-900 pb-2 border-b border-slate-800">Debug Logs</h3>
                        <div className="space-y-1">
                            {logs.map((log, i) => (
                                <div key={i} className="whitespace-pre-wrap border-l-2 border-slate-700 pl-2 py-0.5 hover:bg-slate-800/50">{log}</div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
