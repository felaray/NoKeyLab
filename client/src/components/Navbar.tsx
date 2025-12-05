"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Beaker, Fingerprint, LayoutGrid, GraduationCap, HelpCircle } from "lucide-react";

const navItems = [
    { name: "實驗室首頁", href: "/", icon: LayoutGrid },
    { name: "機制探索", href: "/learn", icon: GraduationCap },
    { name: "整合遊樂場", href: "/playground", icon: Fingerprint },
    { name: "Q&A", href: "/qa", icon: HelpCircle },
];

export function Navbar() {
    const pathname = usePathname();

    return (
        <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-2 rounded-lg">
                            <Beaker className="h-6 w-6 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-slate-900">
                            NoKey<span className="text-indigo-600">Lab</span>
                        </span>
                    </div>

                    <div className="hidden sm:flex sm:space-x-8">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200",
                                        isActive
                                            ? "border-indigo-500 text-gray-900"
                                            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                    )}
                                >
                                    <Icon className="w-4 h-4 mr-2" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </nav>
    );
}
