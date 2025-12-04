import React from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Calendar as CalendarIcon, Clock, Edit2, Trash2 } from "lucide-react";

// 必要な型定義
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
    companies: Company[];
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    onEditSchedule: (company: Company) => void;
    onClearSchedule: (company: Company) => void;
};

export default function CalendarView({ companies, selectedDate, onDateChange, onEditSchedule, onClearSchedule }: Props) {

    // 日付フォーマット関数
    const formatDateToLocal = (date: Date) => {
        const y = date.getFullYear();
        const m = ("00" + (date.getMonth() + 1)).slice(-2);
        const d = ("00" + date.getDate()).slice(-2);
        return `${y}-${m}-${d}`;
    };

    const selectedDateStr = formatDateToLocal(selectedDate);

    // カレンダーの青い点
    const getTileContent = ({ date, view }: { date: Date; view: string }) => {
        if (view !== "month") return null;
        const dateStr = formatDateToLocal(date);
        const hasEvent = companies.some((c) => c.nextDate === dateStr);
        return hasEvent ? <div className="h-1.5 w-1.5 bg-blue-500 rounded-full mx-auto mt-1"></div> : null;
    };

    // カレンダーの文字色設定
    const getTileClassName = ({ date, view }: { date: Date; view: string }) => {
        if (view !== "month") return "";
        if (formatDateToLocal(date) === selectedDateStr) return "!text-white font-bold";
        const day = date.getDay();
        if (day === 6) return "!text-blue-600 font-bold dark:!text-blue-400";
        if (day === 0) return "!text-red-600 font-bold dark:!text-red-400";
        return "text-gray-700 dark:text-gray-300";
    };

    // 選択された日の予定リスト（時間順ソート）
    const eventsOnSelectedDate = companies
        .filter(c => c.nextDate === selectedDateStr)
        .sort((a, b) => {
            if (!a.nextTime && !b.nextTime) return 0;
            if (!a.nextTime) return 1;
            if (!b.nextTime) return -1;
            return a.nextTime!.localeCompare(b.nextTime!);
        });

    return (
        <div className="mb-8 flex flex-col md:grid md:grid-cols-2 gap-6">
            {/* 左側：カレンダー本体 */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 dark:bg-slate-800 dark:border-slate-700 w-full overflow-hidden">
                <h2 className="text-center font-bold mb-4 text-gray-700 flex items-center justify-center gap-2 dark:text-white">
                    <CalendarIcon size={18} /> スケジュール
                </h2>
                <div className="dark:text-white w-full">
                    <Calendar
                        locale="ja-JP"
                        value={selectedDate}
                        onClickDay={(value) => onDateChange(value as Date)}
                        tileContent={getTileContent}
                        tileClassName={getTileClassName}
                        className="border-none w-full !font-sans dark:!bg-slate-800 dark:!text-white"
                        calendarType="gregory"
                        formatDay={(locale, date) => date.getDate().toString()}
                    />
                </div>
            </div>

            {/* 右側：予定詳細リスト */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full dark:bg-slate-800 dark:border-slate-700">
                <h3 className="text-md font-bold text-gray-700 border-b border-gray-100 pb-3 mb-3 dark:text-white dark:border-slate-700">
                    📅 {selectedDateStr} の予定
                </h3>
                <div className="flex-1 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
                    {eventsOnSelectedDate.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <p className="text-sm">予定はありません</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {eventsOnSelectedDate.map(company => (
                                <div key={company.id} className="group relative bg-blue-50/50 p-3 rounded-lg border border-blue-100 hover:bg-blue-50 transition dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600">

                                    {/* 編集・削除ボタン */}
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => onEditSchedule(company)} className="p-1.5 bg-white text-blue-600 rounded shadow hover:bg-blue-50 dark:bg-slate-800 dark:text-blue-400"><Edit2 size={14} /></button>
                                        <button onClick={() => onClearSchedule(company)} className="p-1.5 bg-white text-red-500 rounded shadow hover:bg-red-50 dark:bg-slate-800 dark:text-red-400"><Trash2 size={14} /></button>
                                    </div>

                                    <div className="flex flex-col gap-1 mb-1">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                                            <h4 className="font-bold text-gray-800 dark:text-white truncate">{company.name}</h4>
                                        </div>
                                        {company.nextTime && (
                                            <div className="flex items-center gap-1 text-xs text-gray-500 ml-4 mb-1 dark:text-gray-400">
                                                <Clock size={12} />
                                                <span>{company.nextTime} {company.nextEndTime && `〜 ${company.nextEndTime}`}</span>
                                            </div>
                                        )}
                                        <p className="text-sm text-blue-700 ml-4 font-medium dark:text-blue-300 truncate">
                                            {company.event_content || "予定あり"}
                                        </p>
                                    </div>
                                    {company.event_requirements && (
                                        <p className="text-xs text-gray-500 ml-4 mt-1 bg-white p-2 rounded border border-gray-100 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-300">
                                            {company.event_requirements}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}