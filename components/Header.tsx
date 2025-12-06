import { useState } from "react";
import { User as UserIcon, LogOut, Bell, RefreshCw } from "lucide-react";
import { Notification } from "../types";
import NotificationModal from "./NotificationModal";

type Props = {
    fullName: string;
    onSignOut: () => void;
    isGoogleLinked: boolean;
    checkingMail: boolean;
    onCheckGmail: () => void;
    notifications: Notification[];
    unreadCount: number;
    onReadNotification: (id: number) => void;
};

export default function Header({ fullName, onSignOut, isGoogleLinked, checkingMail, onCheckGmail, notifications, unreadCount, onReadNotification }: Props) {
    const [showNotifications, setShowNotifications] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

    const handleNotificationClick = (notification: Notification) => {
        onReadNotification(notification.id);
        setSelectedNotification(notification);
        setShowNotifications(false);
    };

    const sortedNotifications = [...notifications].sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return (
        <>
            <NotificationModal
                isOpen={!!selectedNotification}
                notification={selectedNotification}
                onClose={() => setSelectedNotification(null)}
            />

            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm dark:bg-slate-900/80 dark:border-slate-800">
                <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🎓</span>
                        <h1 className="text-xl font-bold text-gray-800 hidden sm:block dark:text-white">就活マネージャー</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {isGoogleLinked && (
                            <button onClick={onCheckGmail} disabled={checkingMail} className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-bold transition-all ${checkingMail ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-200'}`}>
                                <RefreshCw size={14} className={checkingMail ? "animate-spin" : ""} />
                                {checkingMail ? "確認中..." : "メール確認"}
                            </button>
                        )}
                        <div className="relative">
                            <button onClick={() => setShowNotifications(!showNotifications)} className="text-gray-500 hover:text-blue-600 transition-colors dark:text-gray-300 dark:hover:text-blue-400">
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">{unreadCount}</span>
                                )}
                            </button>

                            {showNotifications && (
                                // ▼▼▼ 修正：スマホでは画面固定(fixed)で左右いっぱいに表示し、PCでは絶対配置(absolute)に戻す ▼▼▼
                                <div className="fixed top-16 left-2 right-2 z-50 sm:absolute sm:top-10 sm:right-0 sm:left-auto sm:w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden dark:bg-slate-800 dark:border-slate-600">
                                    <div className="p-3 bg-gray-50 border-b border-gray-100 font-bold text-sm text-gray-700 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200">お知らせ</div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {sortedNotifications.length === 0 ? <p className="text-center text-gray-400 text-sm py-4">通知はありません</p> : sortedNotifications.map(n => (
                                            <div
                                                key={n.id}
                                                onClick={() => handleNotificationClick(n)}
                                                className={`p-3 text-sm border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors dark:border-slate-700 dark:hover:bg-slate-700 ${n.is_read ? 'opacity-60' : 'bg-blue-50/30 font-bold dark:bg-slate-700/50'}`}
                                            >
                                                <p className="text-gray-800 dark:text-gray-200 mb-1">{n.message}</p>

                                                {n.email_body && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                                        {n.email_body.substring(0, 50)}...
                                                    </p>
                                                )}

                                                <p className="text-[10px] text-gray-400 mt-2 text-right">{new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        {fullName && (
                            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full dark:bg-slate-800 dark:text-white">
                                <UserIcon size={16} className="text-gray-500 dark:text-gray-300" />
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{fullName}</span>
                            </div>
                        )}
                        <button onClick={onSignOut} className="text-gray-400 hover:text-red-500 transition-colors" title="ログアウト">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>
        </>
    );
}