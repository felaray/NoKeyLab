import Link from "next/link";
import { ArrowRight, Flame, Shield } from "lucide-react";

export default function PlaygroundPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-4">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    整合遊樂場 (Integration Playground)
                </h1>
                <p className="text-gray-400 text-lg leading-relaxed">
                    動態測試您的身分驗證提供商 (Identity Provider) 設定。
                    <br />
                    您的憑證僅保留在瀏覽器中，絕不會傳送到我們的伺服器。
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Firebase Card */}
                <Link
                    href="/playground/firebase"
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 hover:bg-white/10 transition-all hover:border-orange-500/50"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative space-y-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                            <Flame className="w-6 h-6" />
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-white mb-2">
                                Firebase Auth
                            </h2>
                            <p className="text-sm text-gray-400">
                                使用您自己的 Firebase 專案設定來測試 Google 登入與 Passkey 支援。
                            </p>
                        </div>

                        <div className="flex items-center text-sm text-orange-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
                            開始實驗 <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                    </div>
                </Link>

                {/* Entra ID Card */}
                <Link
                    href="/playground/entra"
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 hover:bg-white/10 transition-all hover:border-blue-500/50"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative space-y-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                            <Shield className="w-6 h-6" />
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-white mb-2">
                                Microsoft Entra ID
                            </h2>
                            <p className="text-sm text-gray-400">
                                使用您的 Azure AD 應用程式註冊來測試 Microsoft 帳戶登入與 FIDO2 金鑰。
                            </p>
                        </div>

                        <div className="flex items-center text-sm text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
                            開始實驗 <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
