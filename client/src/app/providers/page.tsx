import Link from "next/link";
import { InstructionCard } from "@/components/InstructionCard";

const providers = [
    {
        name: "Microsoft Entra ID",
        description: "測試 Azure AD 的 Passkey 流程 (FIDO2 Security Keys)。",
        href: "/login/microsoft",
        logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg", // Placeholder or use Icon
    },
    {
        name: "Firebase Auth",
        description: "測試 Google Identity Platform 的 Passkey 整合。",
        href: "/login/firebase",
        logo: "https://firebase.google.com/static/downloads/brand-guidelines/SVG/logo-logomark.svg",
    },
];

export default function ProvidersPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">供應商實戰</h1>
                <p className="mt-2 text-slate-600">
                    測試各大身分驗證服務的 Passkey 整合體驗。
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {providers.map((provider) => (
                    <Link
                        key={provider.href}
                        href={provider.href}
                        className="flex items-center gap-6 bg-white rounded-xl border border-slate-200 p-6 hover:border-indigo-300 hover:shadow-md transition-all"
                    >
                        <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-slate-50 rounded-lg p-2">
                            {/* Simple text fallback if image fails, but using img tag for external logos */}
                            <img src={provider.logo} alt={provider.name} className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">
                                {provider.name}
                            </h3>
                            <p className="text-sm text-slate-600">
                                {provider.description}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>

            <InstructionCard
                title="整合說明"
                description="這些頁面將展示如何將 Passkey 整合到實際的應用程式中。您將看到不同供應商如何處理註冊、登入以及錯誤處理。"
                type="info"
            />
        </div>
    );
}
