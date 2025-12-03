import Link from "next/link";
import { InstructionCard } from "@/components/InstructionCard";
import { Laptop, Smartphone, Keyboard } from "lucide-react";

const modules = [
    {
        title: "Platform Authenticator",
        description: "使用您目前的裝置 (電腦或手機) 進行驗證。例如 Windows Hello, TouchID, FaceID。",
        href: "/learn/platform",
        icon: Laptop,
        color: "text-blue-400",
        bg: "bg-blue-900",
    },
    {
        title: "Roaming Authenticator",
        description: "使用跨裝置驗證器。例如用手機掃描 QR Code 登入電腦，或是插入 USB 金鑰。",
        href: "/learn/roaming",
        icon: Smartphone,
        color: "text-purple-400",
        bg: "bg-purple-900",
    },
    {
        title: "Autofill UI",
        description: "體驗現代化的「條件式 UI」，點擊輸入框即自動跳出 Passkey 選項。",
        href: "/learn/autofill",
        icon: Keyboard,
        color: "text-green-400",
        bg: "bg-green-900",
    },
];

export default function LearnPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-100">機制探索</h1>
                <p className="mt-2 text-slate-400">
                    選擇一個模組來深入了解 Passkey 的不同運作模式。
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {modules.map((module) => {
                    const Icon = module.icon;
                    return (
                        <Link
                            key={module.href}
                            href={module.href}
                            className="group block bg-slate-800/50 rounded-xl border border-slate-700 p-6 hover:border-indigo-500/50 hover:bg-slate-800 transition-all"
                        >
                            <div className={`w-12 h-12 ${module.bg} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform bg-opacity-20`}>
                                <Icon className={`h-6 w-6 ${module.color}`} />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-200 mb-2 group-hover:text-indigo-400 transition-colors">
                                {module.title}
                            </h3>
                            <p className="text-sm text-slate-400">
                                {module.description}
                            </p>
                        </Link>
                    );
                })}
            </div>

            <InstructionCard
                title="學習指南"
                description="這些測試將使用瀏覽器的原生 WebAuthn API，不依賴任何第三方服務。這能幫助您理解最底層的互動邏輯。"
                type="info"
            />
        </div>
    );
}
