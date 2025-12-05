"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Key, RefreshCw, Trash2, Laptop, Smartphone, HelpCircle } from "lucide-react";

interface Credential {
    credentialId: string;
    userId: string;
    userHandle: string;
    username: string;
    signatureCounter: number;
    credType: string;
    regDate: string;
    aaGuid: string;
    authenticatorAttachment?: string;
}

// AAGUID mapping for known authenticators
const AAGUID_MAP: Record<string, string> = {
    "00000000-0000-0000-0000-000000000000": "U2F/WebAuthn",
    "08987058-cadc-4b81-b6e1-30de50dcbe96": "Windows Hello",
    "adce0002-35bc-46eb-ac54-a39ce98b4e58": "Touch ID",
};

interface CredentialListProps {
    refreshTrigger?: number;
    filterType?: "platform" | "cross-platform";
}

export function CredentialList({ refreshTrigger = 0, filterType }: CredentialListProps) {
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchCredentials = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await api.credentials.list(filterType);
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
            fetchCredentials();
        } catch (err: any) {
            alert("刪除失敗: " + err.message);
        }
    };

    useEffect(() => {
        fetchCredentials();
    }, [refreshTrigger, filterType]);

    const getAuthenticatorName = (aaguid: string) => {
        return AAGUID_MAP[aaguid] || "Unknown";
    };

    const getTypeIcon = (attachment?: string) => {
        if (attachment === "platform") return <Laptop className="w-4 h-4 text-indigo-400" />;
        if (attachment === "cross-platform") return <Smartphone className="w-4 h-4 text-amber-400" />;
        return <HelpCircle className="w-4 h-4 text-slate-500" />;
    };

    const getTypeLabel = (attachment?: string) => {
        if (attachment === "platform") return "Platform";
        if (attachment === "cross-platform") return "Roaming";
        return "Unknown";
    };

    return (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-semibold text-slate-200">
                        {filterType === "platform" && "Platform Passkeys"}
                        {filterType === "cross-platform" && "Roaming Passkeys"}
                        {!filterType && "All Passkeys"}
                    </h3>
                    <span className="text-xs text-slate-500">({credentials.length})</span>
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
                        <Key className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p>尚無已儲存的 Passkey</p>
                        <p className="text-xs mt-1">請先完成註冊流程</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-500 border-b border-slate-800">
                                    <th className="pb-3 font-medium">類型</th>
                                    <th className="pb-3 font-medium">使用者</th>
                                    <th className="pb-3 font-medium hidden sm:table-cell">驗證器</th>
                                    <th className="pb-3 font-medium hidden md:table-cell">註冊時間</th>
                                    <th className="pb-3 font-medium text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {credentials.map((cred) => (
                                    <tr key={cred.credentialId} className="group hover:bg-slate-800/30 transition-colors">
                                        <td className="py-3">
                                            <div className="flex items-center gap-2">
                                                {getTypeIcon(cred.authenticatorAttachment)}
                                                <span className="text-slate-400 text-xs hidden lg:inline">
                                                    {getTypeLabel(cred.authenticatorAttachment)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <span className="text-slate-200 font-medium">
                                                {cred.username || "Unknown"}
                                            </span>
                                        </td>
                                        <td className="py-3 hidden sm:table-cell">
                                            <span className="text-slate-400">
                                                {getAuthenticatorName(cred.aaGuid)}
                                            </span>
                                        </td>
                                        <td className="py-3 text-slate-500 hidden md:table-cell">
                                            {new Date(cred.regDate).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 text-right">
                                            <button
                                                onClick={() => handleDelete(cred.credentialId)}
                                                className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                title="刪除"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
