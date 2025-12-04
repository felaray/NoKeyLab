import { useState } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Terminal } from "lucide-react";

interface DynamicConfigFormProps {
    title: string;
    description: string;
    placeholder: string;
    initialValue?: string;
    onSubmit: (config: any) => void;
    isSubmitting?: boolean;
    presets?: { label: string; value: string }[];
    className?: string;
}

export function DynamicConfigForm({
    title,
    description,
    placeholder,
    initialValue = "",
    onSubmit,
    isSubmitting = false,
    className,
    presets = [],
}: DynamicConfigFormProps) {
    const [value, setValue] = useState(initialValue);
    const [error, setError] = useState<string | null>(null);
    const [isValid, setIsValid] = useState(false);

    const validateAndSubmit = () => {
        try {
            setError(null);
            let parsed;
            try {
                // 1. Try standard JSON parse
                parsed = JSON.parse(value);
            } catch (e) {
                // 2. Fallback: Try parsing as JavaScript Object (relaxed JSON)
                // This allows users to paste direct JS objects like { key: "value" }
                try {
                    // Safety: This is a client-side playground tool. The code runs in the user's browser.
                    // We wrap it in parentheses to ensure it's treated as an expression.
                    parsed = new Function("return (" + value + ")")();
                } catch (jsError) {
                    throw e; // Throw the original JSON error if both fail
                }
            }

            setIsValid(true);
            onSubmit(parsed);
        } catch (e) {
            setError("無效的格式。請確認您輸入的是有效的 JSON 或 JavaScript 物件 (例如: 屬性名稱遺漏引號)。");
            setIsValid(false);
        }
    };

    return (
        <div className={cn("space-y-4", className)}>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Terminal className="w-5 h-5 text-purple-400" />
                        {title}
                    </h3>
                    {presets.length > 0 && (
                        <div className="flex gap-2">
                            {presets.map((preset) => (
                                <button
                                    key={preset.label}
                                    onClick={() => {
                                        setValue(preset.value);
                                        setError(null);
                                        setIsValid(false);
                                    }}
                                    className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded px-2 py-1 transition-colors text-gray-400 hover:text-white"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <p className="text-sm text-gray-400">{description}</p>
            </div>

            <div className="relative">
                <textarea
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        setError(null);
                        setIsValid(false);
                    }}
                    placeholder={placeholder}
                    className={cn(
                        "w-full h-64 bg-black/40 border rounded-xl p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 transition-all",
                        error
                            ? "border-red-500/50 focus:ring-red-500/20"
                            : isValid
                                ? "border-green-500/50 focus:ring-green-500/20"
                                : "border-white/10 focus:ring-purple-500/20 focus:border-purple-500/50"
                    )}
                    spellCheck={false}
                />
                <div className="absolute bottom-4 right-4 flex gap-2">
                    {error && (
                        <span className="text-xs text-red-400 flex items-center gap-1 bg-black/60 px-2 py-1 rounded">
                            <AlertCircle className="w-3 h-3" />
                            {error}
                        </span>
                    )}
                    {isValid && (
                        <span className="text-xs text-green-400 flex items-center gap-1 bg-black/60 px-2 py-1 rounded">
                            <CheckCircle2 className="w-3 h-3" />
                            格式正確 (Valid Config)
                        </span>
                    )}
                </div>
            </div>

            <button
                onClick={validateAndSubmit}
                disabled={isSubmitting || !value.trim()}
                className={cn(
                    "w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                    isSubmitting
                        ? "bg-white/5 text-gray-400 cursor-not-allowed"
                        : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20"
                )}
            >
                {isSubmitting ? "初始化中..." : "初始化並測試 (Initialize & Test)"}
            </button>
        </div>
    );
}
