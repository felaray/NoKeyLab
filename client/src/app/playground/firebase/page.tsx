"use client";

import { useState } from "react";
import { DynamicConfigForm } from "@/components/DynamicConfigForm";
import { InstructionCard } from "@/components/InstructionCard";
import { initializeApp, getApps, deleteApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, UserCredential } from "firebase/auth";
import { CheckCircle2, XCircle, User } from "lucide-react";

export default function FirebasePlayground() {
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
            // 1. Clean up existing apps with the same name to avoid conflicts
            const appName = "playground-firebase";
            const existingApp = getApps().find((app) => app.name === appName);
            if (existingApp) {
                addLog("發現已存在的應用程式實例，正在清除...");
                await deleteApp(existingApp);
            }

            // 2. Initialize Firebase
            addLog("正在初始化 Firebase App...");
            const app = initializeApp(config, appName);
            addLog("Firebase App 初始化成功。");

            // 3. Initialize Auth
            const auth = getAuth(app);
            const provider = new GoogleAuthProvider();

            // 4. Trigger Sign In
            addLog("正在觸發 Google 登入彈出視窗...");
            const result = await signInWithPopup(auth, provider);

            // 5. Success
            addLog("登入成功！");
            addLog(`使用者: ${result.user.displayName} (${result.user.email})`);
            addLog(`提供商 ID: ${result.providerId}`);

            setUser(result.user);

        } catch (error: any) {
            console.error(error);
            addLog(`錯誤: ${error.message}`);
            if (error.code === 'auth/unauthorized-domain') {
                addLog("提示: 您需要將此網域 (localhost) 加入到您的 Firebase 控制台 > Authentication > Settings > Authorized domains。");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="space-y-4">
                <h1 className="text-3xl font-bold text-orange-400">Firebase 遊樂場</h1>
                <p className="text-gray-400">
                    測試您的 Firebase 專案的 Google 登入流程。
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <InstructionCard
                        title="需要設定 (Configuration Required)"
                        description="請前往您的 Firebase 控制台 > 專案設定 > 一般，並複製 'firebaseConfig' 物件。"
                        type="info"
                        prerequisites={[
                            "一個 Firebase 專案",
                            "已啟用 Authentication (Google 提供商)",
                            "授權網域 (Authorized Domain): localhost"
                        ]}
                    />

                    <DynamicConfigForm
                        title="Firebase 設定 (Config)"
                        description="請在此貼上您的 firebaseConfig JSON 物件。"
                        placeholder={`{
  "apiKey": "...",
  "authDomain": "...",
  "projectId": "...",
  "storageBucket": "...",
  "messagingSenderId": "...",
  "appId": "..."
}`}
                        presets={[
                            {
                                label: "載入預設設定 (Load Default)",
                                value: `{
  "apiKey": "",
  "authDomain": "",
  "projectId": "",
  "storageBucket": "",
  "messagingSenderId": "",
  "appId": ""
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
                            {user && <span className="text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded">已驗證 (Authenticated)</span>}
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
                        <div className="bg-green-900/10 border border-green-500/20 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4 space-y-4">
                            <div className="flex items-start gap-4">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="w-12 h-12 rounded-full border border-green-500/30" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                        <User className="w-6 h-6" />
                                    </div>
                                )}
                                <div>
                                    <h4 className="font-semibold text-green-100">{user.displayName}</h4>
                                    <p className="text-sm text-green-300/70">{user.email}</p>
                                    <p className="text-xs text-green-300/50 mt-1 font-mono">UID: {user.uid}</p>
                                </div>
                            </div>

                            <button
                                onClick={async () => {
                                    const app = getApps().find(a => a.name === "playground-firebase");
                                    if (app) {
                                        await getAuth(app).signOut();
                                        setUser(null);
                                        addLog("已登出 (Signed Out)");
                                    }
                                }}
                                className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm transition-colors"
                            >
                                登出 (Sign Out)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
