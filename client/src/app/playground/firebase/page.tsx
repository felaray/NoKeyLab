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
        addLog("Starting initialization...");

        try {
            // 1. Clean up existing apps with the same name to avoid conflicts
            const appName = "playground-firebase";
            const existingApp = getApps().find((app) => app.name === appName);
            if (existingApp) {
                addLog("Found existing app instance, cleaning up...");
                await deleteApp(existingApp);
            }

            // 2. Initialize Firebase
            addLog("Initializing Firebase App...");
            const app = initializeApp(config, appName);
            addLog("Firebase App initialized successfully.");

            // 3. Initialize Auth
            const auth = getAuth(app);
            const provider = new GoogleAuthProvider();

            // 4. Trigger Sign In
            addLog("Triggering Google Sign-In popup...");
            const result = await signInWithPopup(auth, provider);

            // 5. Success
            addLog("Sign-In Successful!");
            addLog(`User: ${result.user.displayName} (${result.user.email})`);
            addLog(`Provider ID: ${result.providerId}`);

            setUser(result.user);

        } catch (error: any) {
            console.error(error);
            addLog(`ERROR: ${error.message}`);
            if (error.code === 'auth/unauthorized-domain') {
                addLog("HINT: You need to add this domain (localhost) to your Firebase Console > Authentication > Settings > Authorized domains.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="space-y-4">
                <h1 className="text-3xl font-bold text-orange-400">Firebase Playground</h1>
                <p className="text-gray-400">
                    Test your Firebase project's Google Sign-In flow.
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <InstructionCard
                        title="Configuration Required"
                        description="Go to your Firebase Console > Project Settings > General and copy the 'firebaseConfig' object."
                        type="info"
                        prerequisites={[
                            "A Firebase Project",
                            "Authentication enabled (Google Provider)",
                            "Authorized Domain: localhost"
                        ]}
                    />

                    <DynamicConfigForm
                        title="Firebase Config"
                        description="Paste your firebaseConfig JSON object here."
                        placeholder={`{
  "apiKey": "...",
  "authDomain": "...",
  "projectId": "...",
  "storageBucket": "...",
  "messagingSenderId": "...",
  "appId": "..."
}`}
                        onSubmit={handleInitializeAndTest}
                        isSubmitting={isSubmitting}
                    />
                </div>

                <div className="space-y-6">
                    <div className="bg-black/40 border border-white/10 rounded-xl p-6 min-h-[400px] flex flex-col">
                        <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
                            <span>Execution Logs</span>
                            {user && <span className="text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded">Authenticated</span>}
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
                        <div className="bg-green-900/10 border border-green-500/20 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4">
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
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
