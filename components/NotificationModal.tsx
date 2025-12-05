import React from "react";
import { Mail, X } from "lucide-react";
import { Notification } from "../types";

type Props = {
    isOpen: boolean;
    notification: Notification | null;
    onClose: () => void;
};

export default function NotificationModal({ isOpen, notification, onClose }: Props) {
    if (!isOpen || !notification) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col dark:bg-slate-800 dark:border dark:border-slate-700 animate-in fade-in zoom-in duration-200">

                {/* ヘッダー */}
                <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full dark:bg-blue-900">
                            <Mail className="text-blue-600 dark:text-blue-300" size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white leading-tight">
                                {notification.message}
                            </h2>
                            <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.created_at).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X size={24} />
                    </button>
                </div>

                {/* 本文エリア（スクロール可能） */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {notification.email_body ? (
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap dark:text-gray-300 font-mono">
                            {notification.email_body}
                        </p>
                    ) : (
                        <p className="text-sm text-gray-400 italic text-center py-10">
                            (本文はありません)
                        </p>
                    )}
                </div>

                {/* フッター */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 transition"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
}