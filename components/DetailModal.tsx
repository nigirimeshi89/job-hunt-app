import React from "react";

// Company型定義
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

const PRIORITY_OPTIONS = ["高", "中", "低"];

type Props = {
    isOpen: boolean;
    company: Company | null;
    onClose: () => void;
    onSave: () => void;
    onChange: (updatedCompany: Company) => void;
};

export default function DetailModal({ isOpen, company, onClose, onSave, onChange }: Props) {
    if (!isOpen || !company) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto dark:bg-slate-800 dark:border dark:border-slate-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">📝 詳細メモ: {company.name}</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 dark:bg-slate-900 dark:border-slate-700">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 dark:text-gray-400">志望度</label>
                            <select
                                className="border p-2 rounded w-full bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                value={company.priority || "中"}
                                onChange={(e) => onChange({ ...company, priority: e.target.value })}
                            >
                                {PRIORITY_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 dark:text-gray-400">業界</label>
                            <input
                                type="text"
                                className="border p-2 rounded w-full dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                value={company.industry || ""}
                                onChange={(e) => onChange({ ...company, industry: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400">企業からのメールアドレス (Gmail検索用)</label>
                        <input
                            type="email"
                            placeholder="hr@company.com"
                            className="border p-2 rounded w-full dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            value={company.contact_email || ""}
                            onChange={(e) => onChange({ ...company, contact_email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400">マイページURL</label>
                        <input
                            type="text"
                            className="border p-2 rounded w-full dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            value={company.mypage_url || ""}
                            onChange={(e) => onChange({ ...company, mypage_url: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-sm font-bold text-gray-600 dark:text-gray-400">ID</label>
                            <input
                                type="text"
                                className="border p-2 rounded w-full dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                value={company.login_id || ""}
                                onChange={(e) => onChange({ ...company, login_id: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-600 dark:text-gray-400">PASS</label>
                            <input
                                type="text"
                                className="border p-2 rounded w-full dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                value={company.login_password || ""}
                                onChange={(e) => onChange({ ...company, login_password: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400">メモ</label>
                        <textarea
                            className="border p-2 rounded w-full h-32 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            value={company.memo || ""}
                            onChange={(e) => onChange({ ...company, memo: e.target.value })}
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