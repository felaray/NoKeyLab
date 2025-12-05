"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Key, RefreshCw, User, ShieldCheck, Trash2, Smartphone, Laptop } from "lucide-react";

interface Credential {
    credentialId: string;
    userId: string;
    userHandle: string;
    username: string; // Added username
    signatureCounter: number;
    credType: string;
    regDate: string;
    aaGuid: string;
}

// Simple AAGUID mapping (In a real app, use FIDO Metadata Service)
const AAGUID_MAP: Record<string, { name: string; icon: any }> = {
    "00000000-0000-0000-0000-000000000000": { name: "None (U2F/WebAuthn)", icon: Key },
    "08987058-cadc-4b81-b6e1-30de50dcbe96": { name: "Windows Hello", icon: Laptop },
    "adce0002-35bc-46eb-ac54-a39ce98b4e58": { name: "Touch ID", icon: Laptop },
    // Add more common AAGUIDs here if needed
};

export function CredentialList({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchCredentials = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await api.credentials.list();
            setCredentials(data);
        } catch (err: any) {
            setError(err.message || "Failed to fetch credentials");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("確定要刪除此 Passkey 嗎？")) return;
        try {
            await api.credentials.delete(id);
            fetchCredentials(); // Refresh list
        } catch (err: any) {
            alert("刪除失敗: " + err.message);
        }
    };

    useEffect(() => {
        fetchCredentials();
    }, [refreshTrigger]);

    const getAuthenticatorInfo = (aaguid: string) => {
        if (AAGUID_MAP[aaguid]) return AAGUID_MAP[aaguid];
        // Default guess based on context is hard without metadata, return generic
        return { name: "Unknown Authenticator", icon: ShieldCheck };
    };

    return (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-semibold text-slate-200">我的 Passkey 列表 (Server Side)</h3>
                </div>
                <button
                    onClick={fetchCredentials}
                    disabled={loading}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                    title="重新整理"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            <div className="p-4">
                {error && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-200 text-sm">
                        {error}
                    </div>
                )}

                {credentials.length === 0 && !loading ? (
                    <div className="text-center py-8 text-slate-500">
                        <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>尚無已儲存的 Passkey</p>
                        <p className="text-xs mt-1">請先完成註冊流程</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {credentials.map((cred, index) => {
                            const authInfo = getAuthenticatorInfo(cred.aaGuid);
                            const AuthIcon = authInfo.icon;

                            return (
                                <div key={index} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 hover:border-indigo-500/30 transition-colors group">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-indigo-500/10 p-2 rounded-md">
                                                <AuthIcon className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-slate-200 flex items-center gap-2">
                                                    {authInfo.name}
                                                    <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-400 font-mono">
                                                        {cred.aaGuid.substring(0, 8)}...
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    <span className="font-medium text-slate-300">
                                                        {cred.username || "Unknown User"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="text-xs text-slate-500">
                                                {new Date(cred.regDate).toLocaleString()}
                                            </div>
                                            <button
                                                onClick={() => handleDelete(cred.credentialId)}
                                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                title="刪除"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 pt-2 border-t border-slate-700/50 mt-2">
                                        <div className="grid grid-cols-[80px_1fr] gap-2 text-xs">
                                            <span className="text-slate-500">ID</span>
                                            <span className="font-mono text-slate-300 break-all">{cred.credentialId}</span>
                                        </div>
                                        <div className="grid grid-cols-[80px_1fr] gap-2 text-xs">
                                            <span className="text-slate-500">Counter</span>
                                            <span className="font-mono text-emerald-400">{cred.signatureCounter}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
