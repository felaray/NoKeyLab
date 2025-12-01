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
                type === "info" && "bg-blue-50/50 border-blue-100 text-blue-900",
                type === "warning" && "bg-amber-50/50 border-amber-100 text-amber-900",
                type === "success" && "bg-green-50/50 border-green-100 text-green-900",
                className
            )}
        >
            <div className="flex items-start gap-4">
                <div className="mt-1 shrink-0">
                    {type === "info" && <Info className="h-6 w-6 text-blue-600" />}
                    {type === "warning" && <AlertCircle className="h-6 w-6 text-amber-600" />}
                    {type === "success" && <CheckCircle2 className="h-6 w-6 text-green-600" />}
                </div>
                <div className="space-y-4 flex-1">
                    <div>
                        <h3 className="font-semibold text-lg">{title}</h3>
                        <p className="mt-1 text-sm opacity-90 leading-relaxed">
                            {description}
                        </p>
                    </div>

                    {prerequisites.length > 0 && (
                        <div className="bg-white/60 rounded-lg p-4 backdrop-blur-sm">
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
