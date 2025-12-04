import React from "react";
import { Calendar as CalendarIcon } from "lucide-react";

// Companyの型定義（page.tsxと同じ）
type Company = {
    id: number;
    name: string;
    status: string;
    nextDate: string;
    nextTime?: string;
    nextEndTime?: string;
    event_content?: string;
    event_requirements?: string;
    mypage_url?: string;
    login_id?: string;
    login_password?: string;
    memo?: string;
    priority: string;
    industry?: string;
    contact_email?: string;
};

type Props = {
    isOpen: boolean;
    company: Company | null;
    onClose: () => void;
    onSave: () => void;
    onChange: (updatedCompany: Company) => void;
};

export default function ScheduleModal({ isOpen, company, onClose, onSave, onChange }: Props) {
    if (!isOpen || !company) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg dark:bg-slate-800 dark:border dark:border-slate-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
                    <CalendarIcon className="text-blue-600 dark:text-blue-400" /> 日程登録: {company.name}
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1 dark:text-gray-400">日時</label>
                        <input
                            type="date"
                            className="border p-2 rounded w-full dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            value={company.nextDate || ""}
                            onChange={(e) => onChange({ ...company, nextDate: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1 dark:text-gray-400">開始時間</label>
                            <input
                                type="time"
                                className="border p-2 rounded w-full dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                value={company.nextTime || ""}
                                onChange={(e) => onChange({ ...company, nextTime: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 mb-2">〜</span>
                            <div className="w-full">
                                <label className="block text-sm font-bold text-gray-600 mb-1 dark:text-gray-400">終了時間</label>
                                <input
                                    type="time"
                                    className="border p-2 rounded w-full dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    value={company.nextEndTime || ""}
                                    onChange={(e) => onChange({ ...company, nextEndTime: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1 dark:text-gray-400">内容</label>
                        <input
                            type="text"
                            placeholder="例：会社説明会"
                            className="border p-2 rounded w-full dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            value={company.event_content || ""}
                            onChange={(e) => onChange({ ...company, event_content: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1 dark:text-gray-400">持ち物</label>
                        <textarea
                            className="border p-2 rounded w-full h-24 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            value={company.event_requirements || ""}
                            onChange={(e) => onChange({ ...company, event_requirements: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t dark:border-slate-700">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg dark:text-gray-400 dark:hover:bg-slate-700"
                        >
                            キャンセル
                        </button>
                        <button
                            onClick={onSave}
                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700"
                        >
                            保存
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}