import Link from "next/link";
import { InstructionCard } from "@/components/InstructionCard";
import { Laptop, Smartphone, Keyboard } from "lucide-react";

const modules = [
    {
        title: "Platform Authenticator",
        description: "使用您目前的裝置 (電腦或手機) 進行驗證。例如 Windows Hello, TouchID, FaceID。",
        href: "/learn/platform",
        icon: Laptop,
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-500/20",
    },
    {
        title: "Roaming Authenticator",
        description: "使用跨裝置驗證器。例如用手機掃描 QR Code 登入電腦，或是插入 USB 金鑰。",
        href: "/learn/roaming",
        icon: Smartphone,
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-500/20",
    },
    {
        title: "Autofill UI",
        description: "體驗現代化的「條件式 UI」，點擊輸入框即自動跳出 Passkey 選項。",
        href: "/learn/autofill",
        icon: Keyboard,
        color: "text-green-600 dark:text-green-400",
        bg: "bg-green-500/20",
    },
];

export default function LearnPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">機制探索</h1>
                <p className="mt-2 text-slate-600 dark:text-gray-400">
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
                            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md transition-all dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:border-indigo-500/50"
                        >
                            <div className={`w-12 h-12 ${module.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <Icon className={`h-6 w-6 ${module.color}`} />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400 transition-colors">
                                {module.title}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-gray-400">
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
