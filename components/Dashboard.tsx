import React from "react";
import { LayoutDashboard, Briefcase, CheckCircle, Star } from "lucide-react";

type Props = {
    totalCount: number;
    interviewCount: number;
    offerCount: number;
    highPriorityActiveCount: number;
};

export default function Dashboard({ totalCount, interviewCount, offerCount, highPriorityActiveCount }: Props) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
            {/* 総エントリー */}
            <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-blue-100 relative overflow-hidden dark:bg-slate-800 dark:border-slate-700">
                <div className="absolute top-0 right-0 p-2 opacity-10 dark:opacity-30 dark:text-white">
                    <LayoutDashboard size={40} />
                </div>
                <p className="text-xs text-gray-500 font-bold mb-1 dark:text-gray-400">総エントリー</p>
                <p className="text-xl md:text-2xl font-black text-gray-800 dark:text-white">
                    {totalCount}
                    <span className="text-xs font-normal text-gray-400 ml-1">社</span>
                </p>
            </div>

            {/* 面接中 */}
            <div className="bg-gradient-to-br from-sky-50 to-white p-3 md:p-4 rounded-xl shadow-sm border border-sky-100 relative overflow-hidden dark:from-slate-800 dark:to-slate-800 dark:border-slate-700">
                <div className="absolute top-0 right-0 p-2 opacity-10 text-sky-600 dark:opacity-30 dark:text-sky-400">
                    <Briefcase size={40} />
                </div>
                <p className="text-xs text-sky-600 font-bold mb-1 dark:text-sky-400">面接中</p>
                <p className="text-xl md:text-2xl font-black text-sky-700 dark:text-sky-300">
                    {interviewCount}
                    <span className="text-xs font-normal text-sky-400 ml-1">社</span>
                </p>
            </div>

            {/* 内定 */}
            <div className="bg-gradient-to-br from-pink-50 to-white p-3 md:p-4 rounded-xl shadow-sm border border-pink-100 relative overflow-hidden dark:from-slate-800 dark:to-slate-800 dark:border-slate-700">
                <div className="absolute top-0 right-0 p-2 opacity-10 text-pink-600 dark:opacity-30 dark:text-pink-400">
                    <CheckCircle size={40} />
                </div>
                <p className="text-xs text-pink-600 font-bold mb-1 dark:text-pink-400">内定</p>
                <p className="text-xl md:text-2xl font-black text-pink-600 dark:text-pink-300">
                    {offerCount}
                    <span className="text-xs font-normal text-pink-400 ml-1">社</span>
                </p>
            </div>

            {/* 第一志望 残り */}
            <div className="bg-gradient-to-br from-yellow-50 to-white p-3 md:p-4 rounded-xl shadow-sm border border-yellow-100 relative overflow-hidden dark:from-slate-800 dark:to-slate-800 dark:border-slate-700">
                <div className="absolute top-0 right-0 p-2 opacity-10 text-yellow-600 dark:opacity-30 dark:text-yellow-400">
                    <Star size={40} />
                </div>
                <p className="text-xs text-yellow-600 font-bold mb-1 dark:text-yellow-400">第一志望 残り</p>
                <p className="text-xl md:text-2xl font-black text-yellow-600 dark:text-yellow-300">
                    {highPriorityActiveCount}
                    <span className="text-xs font-normal text-yellow-400 ml-1">社</span>
                </p>
            </div>
        </div>
    );
}