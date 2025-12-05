import Link from "next/link";
import { ArrowRight, GraduationCap, Fingerprint, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="text-center space-y-4 py-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">NoKey</span><span className="text-indigo-600 dark:text-indigo-400">Lab</span>
        </h1>
        <p className="max-w-2xl mx-auto text-xl text-slate-600">
          探索無密碼登入的未來。
          <br />
          了解 Passkey 運作原理，並體驗各大供應商的整合實作。
        </p>
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Learning Zone */}
        <div className="group relative bg-white rounded-2xl shadow-sm border border-slate-200 p-8 hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 bg-blue-100 rounded-full p-3 group-hover:scale-110 transition-transform">
            <GraduationCap className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">機制探索 (Mechanism Explorer)</h2>
          <p className="text-slate-600 mb-6">
            深入了解 Passkey 的底層運作方式。體驗「本機驗證」與「跨裝置漫遊」的差異，以及現代化的自動填入體驗。
          </p>
          <ul className="space-y-3 mb-8 text-slate-600">
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              <span>Platform Authenticator (Windows Hello / FaceID)</span>
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              <span>Roaming Authenticator (手機 / YubiKey)</span>
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              <span>Conditional UI (Autofill)</span>
            </li>
          </ul>
          <Link
            href="/learn"
            className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-800"
          >
            開始學習 <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        {/* Provider Zone */}
        <div className="group relative bg-white rounded-2xl shadow-sm border border-slate-200 p-8 hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 bg-indigo-100 rounded-full p-3 group-hover:scale-110 transition-transform">
            <Fingerprint className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">整合遊樂場 (Integration Playground)</h2>
          <p className="text-slate-600 mb-6">
            實測主流身分驗證服務的 Passkey 整合。比較 Microsoft Entra ID 與 Firebase Auth 的實作差異與使用者體驗。
          </p>
          <ul className="space-y-3 mb-8 text-slate-600">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>Microsoft Entra ID (Azure AD)</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span>Firebase Auth (Google)</span>
            </li>
          </ul>
          <Link
            href="/providers"
            className="inline-flex items-center text-indigo-600 font-semibold hover:text-indigo-800"
          >
            開始測試 <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
