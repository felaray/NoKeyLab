import { cn } from "@/lib/utils";
import { Info, AlertCircle, CheckCircle2 } from "lucide-react";

interface InstructionCardProps {
    title: string;
    description: string;
    prerequisites?: string[];
    steps?: string[];
    type?: "info" | "warning" | "success";
    className?: string;
}

export function InstructionCard({
    title,
    description,
    prerequisites = [],
    steps = [],
    type = "info",
    className,
}: InstructionCardProps) {
    return (
        <div
            className={cn(
                "rounded-xl border p-6 shadow-sm transition-all",
                type === "info" && "bg-blue-900/20 border-blue-800 text-blue-200",
                type === "warning" && "bg-amber-900/20 border-amber-800 text-amber-200",
                type === "success" && "bg-green-900/20 border-green-800 text-green-200",
                className
            )}
        >
            <div className="flex items-start gap-4">
                <div className="mt-1 shrink-0">
                    {type === "info" && <Info className="h-6 w-6 text-blue-400" />}
                    {type === "warning" && <AlertCircle className="h-6 w-6 text-amber-400" />}
                    {type === "success" && <CheckCircle2 className="h-6 w-6 text-green-400" />}
                </div>
                <div className="space-y-4 flex-1">
                    <div>
                        <h3 className="font-semibold text-lg">{title}</h3>
                        <p className="mt-1 text-sm opacity-90 leading-relaxed">
                            {description}
                        </p>
                    </div>

                    {prerequisites.length > 0 && (
                        <div className="bg-black/20 rounded-lg p-4 backdrop-blur-sm border border-white/5">
                            <h4 className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">
                                測試需求 (Prerequisites)
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                {prerequisites.map((req, index) => (
                                    <li key={index}>{req}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {steps.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">
                                測試步驟 (Steps)
                            </h4>
                            <ol className="list-decimal list-inside space-y-1 text-sm">
                                {steps.map((step, index) => (
                                    <li key={index}>{step}</li>
                                ))}
                            </ol>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
