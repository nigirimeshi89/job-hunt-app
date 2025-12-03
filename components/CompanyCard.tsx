import React from "react";
import { CalendarDays, MapPin, Trash2, FileText, Calendar as CalendarIcon, ExternalLink } from "lucide-react"; // アイコン読み込み

type Company = {
    id: number;
    name: string;
    status: string;
    nextDate: string;
    priority: string;
    industry?: string;
    mypage_url?: string;
    login_id?: string;
    login_password?: string;
    memo?: string;
    event_content?: string;
    event_requirements?: string;
};

type Props = {
    company: Company;
    STATUS_OPTIONS: string[];
    onStatusChange: (id: number, val: string) => void;
    onEdit: (company: Company) => void;
    onSchedule: (company: Company) => void;
    onDelete: (id: number) => void;
};

export default function CompanyCard({ company, STATUS_OPTIONS, onStatusChange, onEdit, onSchedule, onDelete }: Props) {

    // ステータスごとの色設定（少し淡く上品な色味に調整）
    const getStatusColor = (status: string) => {
        switch (status) {
            case "内定": return "bg-pink-50 border-pink-200 text-pink-700";
            case "お見送り": return "bg-gray-100 border-gray-200 text-gray-500 opacity-80";
            case "最終面接": return "bg-purple-50 border-purple-200 text-purple-700";
            case "未エントリー": return "bg-white border-gray-200 text-gray-600";
            default: return "bg-blue-50 border-blue-200 text-blue-700";
        }
    };

    const getPriorityIcon = (priority: string) => {
        if (priority === "高") return <span className="text-orange-500">⭐⭐⭐</span>;
        if (priority === "中" || priority === "普通") return <span className="text-yellow-400">⭐⭐</span>;
        return <span className="text-gray-300">⭐</span>;
    };

    // カウントダウンバッジ
    const getDaysRemaining = (dateStr: string) => {
        if (!dateStr) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [y, m, d] = dateStr.split('-').map(Number);
        const target = new Date(y, m - 1, d);
        const diffTime = target.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const CountdownBadge = ({ dateStr }: { dateStr: string }) => {
        const days = getDaysRemaining(dateStr);
        if (days === null) return null;

        let badgeStyle = "bg-blue-100 text-blue-700";
        let text = `あと${days}日`;

        if (days < 0) { badgeStyle = "bg-gray-200 text-gray-500"; text = "終了"; }
        else if (days === 0) { badgeStyle = "bg-red-500 text-white animate-pulse"; text = "🔥 今日！"; }
        else if (days === 1) { badgeStyle = "bg-red-100 text-red-600 font-bold"; text = "あと1日！"; }
        else if (days <= 3) { badgeStyle = "bg-orange-100 text-orange-700 font-bold"; }

        return (
            <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${badgeStyle}`}>
                <CalendarDays size={12} />
                {text}
            </span>
        );
    };

    return (
        <div className={`group relative border rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 bg-white`}>
            {/* 上段：企業名とタグ */}
            <div className="flex justify-between items-start mb-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                            {company.name}
                        </h2>
                        {company.industry && (
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                                {company.industry}
                            </span>
                        )}
                    </div>
                    {/* 志望度 */}
                    <div className="text-xs font-bold flex items-center gap-1">
                        <span className="text-gray-400">志望度:</span>
                        {getPriorityIcon(company.priority)}
                    </div>
                </div>

                {/* 右上：日程・カウントダウン */}
                <div className="flex flex-col items-end gap-1">
                    {company.nextDate ? (
                        <>
                            <CountdownBadge dateStr={company.nextDate} />
                            <span className="text-xs text-gray-400 font-mono mt-1">{company.nextDate}</span>
                        </>
                    ) : (
                        <span className="text-xs text-gray-300 bg-gray-50 px-2 py-1 rounded-full">日程未定</span>
                    )}
                </div>
            </div>

            <hr className="border-gray-100 my-3" />

            {/* 下段：アクションエリア */}
            <div className="flex justify-between items-center">
                {/* ステータスプルダウン */}
                <div className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-2 ${getStatusColor(company.status)}`}>
                    <select
                        value={company.status}
                        onChange={(e) => onStatusChange(company.id, e.target.value)}
                        className="bg-transparent outline-none cursor-pointer appearance-none w-full"
                    >
                        {STATUS_OPTIONS.map((opt) => (
                            <option key={opt} value={opt} className="text-gray-800 bg-white">
                                {opt}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 操作ボタン群 */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onSchedule(company)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors tooltip"
                        title="日程を入力"
                    >
                        <CalendarIcon size={18} />
                    </button>

                    <button
                        onClick={() => onEdit(company)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="詳細メモ"
                    >
                        <FileText size={18} />
                    </button>

                    <button
                        onClick={() => onDelete(company.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="削除"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}