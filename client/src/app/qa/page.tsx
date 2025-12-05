"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { HelpCircle, Copy, Check, ExternalLink, ArrowLeft, Chrome, Globe } from "lucide-react";

type BrowserType = 'edge' | 'chrome' | 'firefox' | 'safari' | 'other';

export default function QAPage() {
    const [copied, setCopied] = useState(false);
    const [browserType, setBrowserType] = useState<BrowserType>('other');
    const [settingsUrl, setSettingsUrl] = useState('');

    useEffect(() => {
        // 偵測瀏覽器類型
        const ua = navigator.userAgent;
        const isEdge = ua.indexOf("Edg") > -1;
        const isChrome = ua.indexOf("Chrome") > -1 && !isEdge;
        const isFirefox = ua.indexOf("Firefox") > -1;
        const isSafari = ua.indexOf("Safari") > -1 && !isChrome && !isEdge;

        // 取得當前網域並編碼 (不含 port，Edge 的 domain 參數不支援 port)
        const domainWithoutPort = window.location.protocol + '//' + window.location.hostname;
        const encodedDomain = encodeURIComponent(domainWithoutPort);

        if (isEdge) {
            setBrowserType('edge');
            setSettingsUrl(`edge://settings/autofill/passwords/details?domain=${encodedDomain}`);
        } else if (isChrome) {
            setBrowserType('chrome');
            // Chrome 沒有 domain filter 的 URL 參數，只能導到主頁面
            setSettingsUrl('chrome://settings/passwords');
        } else if (isFirefox) {
            setBrowserType('firefox');
            // Firefox 使用 about:logins，不支援 domain filter
            setSettingsUrl('about:logins');
        } else if (isSafari) {
            setBrowserType('safari');
            setSettingsUrl('');  // Safari 沒有可複製的 URL
        } else {
            setBrowserType('other');
            setSettingsUrl('');
        }
    }, []);

    const handleCopy = () => {
        if (settingsUrl) {
            navigator.clipboard.writeText(settingsUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const getBrowserName = () => {
        switch (browserType) {
            case 'edge': return 'Microsoft Edge';
            case 'chrome': return 'Google Chrome';
            case 'firefox': return 'Mozilla Firefox';
            case 'safari': return 'Safari';
            default: return '瀏覽器';
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <Link href="/" className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    回到首頁
                </Link>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <HelpCircle className="text-indigo-500" />
                    Q&A / 常見問題
                </h1>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                    Passkey 使用過程中的常見問題與解答
                </p>
            </div>

            {/* Cards Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Delete Passkey Guide Card */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">
                        如何刪除這台裝置上的 Passkey？
                    </h3>

                    {/* 顯示偵測到的瀏覽器 */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-sm text-slate-600 dark:text-slate-300 mb-4">
                        <Globe className="w-4 h-4" />
                        偵測到：{getBrowserName()}
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                        基於瀏覽器安全限制，我們無法直接為您開啟設定頁面。請依照以下步驟操作：
                    </p>

                    {/* Edge - 有完整 URL 支援 */}
                    {browserType === 'edge' && (
                        <ol className="list-decimal list-inside space-y-4 text-sm text-slate-700 dark:text-slate-300">
                            <li>
                                <span>點擊下方按鈕複製設定路徑（已包含本站網域篩選）：</span>
                                <div className="flex flex-col sm:flex-row gap-2 mt-2 ml-5">
                                    <code className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-md text-xs font-mono break-all select-all flex-1 border border-slate-200 dark:border-slate-700">
                                        {settingsUrl}
                                    </code>
                                    <button
                                        onClick={handleCopy}
                                        className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-500 transition-colors flex items-center gap-2 justify-center whitespace-nowrap"
                                    >
                                        {copied ? <><Check className="w-4 h-4" />已複製！</> : <><Copy className="w-4 h-4" />複製路徑</>}
                                    </button>
                                </div>
                            </li>
                            <li>在瀏覽器上方<strong>網址列</strong>貼上並按下 Enter。</li>
                            <li>頁面會直接顯示本站的 Passkey，點擊刪除即可。</li>
                        </ol>
                    )}

                    {/* Chrome - 基本 URL 支援 */}
                    {browserType === 'chrome' && (
                        <ol className="list-decimal list-inside space-y-4 text-sm text-slate-700 dark:text-slate-300">
                            <li>
                                <span>點擊下方按鈕複製設定路徑：</span>
                                <div className="flex flex-col sm:flex-row gap-2 mt-2 ml-5">
                                    <code className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-md text-xs font-mono break-all select-all flex-1 border border-slate-200 dark:border-slate-700">
                                        {settingsUrl}
                                    </code>
                                    <button
                                        onClick={handleCopy}
                                        className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-500 transition-colors flex items-center gap-2 justify-center whitespace-nowrap"
                                    >
                                        {copied ? <><Check className="w-4 h-4" />已複製！</> : <><Copy className="w-4 h-4" />複製路徑</>}
                                    </button>
                                </div>
                            </li>
                            <li>在瀏覽器上方<strong>網址列</strong>貼上並按下 Enter。</li>
                            <li>在搜尋框輸入本站網址，找到並刪除對應的 Passkey。</li>
                        </ol>
                    )}

                    {/* Firefox - 使用 about:logins */}
                    {browserType === 'firefox' && (
                        <ol className="list-decimal list-inside space-y-4 text-sm text-slate-700 dark:text-slate-300">
                            <li>
                                <span>點擊下方按鈕複製設定路徑：</span>
                                <div className="flex flex-col sm:flex-row gap-2 mt-2 ml-5">
                                    <code className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-md text-xs font-mono break-all select-all flex-1 border border-slate-200 dark:border-slate-700">
                                        {settingsUrl}
                                    </code>
                                    <button
                                        onClick={handleCopy}
                                        className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-500 transition-colors flex items-center gap-2 justify-center whitespace-nowrap"
                                    >
                                        {copied ? <><Check className="w-4 h-4" />已複製！</> : <><Copy className="w-4 h-4" />複製路徑</>}
                                    </button>
                                </div>
                            </li>
                            <li>在瀏覽器上方<strong>網址列</strong>貼上並按下 Enter。</li>
                            <li>
                                <span className="text-amber-600 dark:text-amber-400">⚠️ 注意：</span> Firefox 的 Passkey 可能儲存在作業系統層級（如 Windows Hello 或 macOS Keychain），而非瀏覽器內部。
                            </li>
                        </ol>
                    )}

                    {/* Safari - 需要透過系統設定 */}
                    {browserType === 'safari' && (
                        <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
                            <p className="text-amber-600 dark:text-amber-400">
                                Safari 的 Passkey 儲存在 iCloud 鑰匙圈中，需要透過系統設定來管理：
                            </p>
                            <ol className="list-decimal list-inside space-y-2">
                                <li>點擊左上角  選單 → <strong>系統設定</strong></li>
                                <li>選擇 <strong>密碼</strong>（或開啟「密碼」App - macOS Sequoia 15+）</li>
                                <li>使用 Touch ID 或密碼驗證</li>
                                <li>搜尋本站網址，找到並刪除對應的 Passkey</li>
                            </ol>
                        </div>
                    )}

                    {/* Other browsers */}
                    {browserType === 'other' && (
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                            <p>請在您的瀏覽器設定中尋找「密碼」或「Passkey」相關選項。</p>
                        </div>
                    )}

                    {/* Windows 11 捷徑 - 只在非 Safari 時顯示 */}
                    {browserType !== 'safari' && (
                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                                <ExternalLink className="w-4 h-4" />
                                Windows 11 快捷方式
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                                如果您的 Passkey 儲存於 Windows Hello，可以點擊下方連結直接開啟系統設定：
                            </p>
                            <a
                                href="ms-settings:savedpasskeys"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-500 transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" />
                                開啟 Windows 通行密鑰設定
                            </a>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                ⚠️ 此功能僅適用於 Windows 11，且僅對存在 Windows 系統內的 Passkey 有效
                            </p>
                        </div>
                    )}
                </div>

                {/* 可以在這裡繼續新增更多 QA 卡片 */}
            </div>
        </div>
    );
}
