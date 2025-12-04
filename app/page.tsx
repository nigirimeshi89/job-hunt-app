"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
// useTheme, Sun, Moon を削除しました
import { LayoutDashboard, Briefcase, CheckCircle, Star, LogOut, Plus, Search, User as UserIcon, Calendar as CalendarIcon } from "lucide-react";

import CompanyCard from "../components/CompanyCard";

type Company = {
  id: number;
  name: string;
  status: string;
  nextDate: string;
  event_content?: string;
  event_requirements?: string;
  mypage_url?: string;
  login_id?: string;
  login_password?: string;
  memo?: string;
  priority: string;
  industry?: string;
};

const STATUS_OPTIONS = [
  "未エントリー", "書類選考中", "1次面接", "2次面接", "最終面接", "内定", "お見送り",
];
const PRIORITY_OPTIONS = ["高", "中", "低"];

export default function Home() {
  // useTheme 関連のコードを削除しました

  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyName, setCompanyName] = useState("");

  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [schedulingCompany, setSchedulingCompany] = useState<Company | null>(null);

  const [searchText, setSearchText] = useState("");
  const [filterPriority, setFilterPriority] = useState("すべて");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>("");

  useEffect(() => {
    const today = new Date();
    setSelectedDateStr(formatDateToLocal(today));

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCompanies(session.user.id);
        fetchProfile(session.user.id);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCompanies(session.user.id);
        fetchProfile(session.user.id);
      } else {
        setCompanies([]);
        setFullName("");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const formatDateToLocal = (date: Date) => {
    const y = date.getFullYear();
    const m = ("00" + (date.getMonth() + 1)).slice(-2);
    const d = ("00" + date.getDate()).slice(-2);
    return `${y}-${m}-${d}`;
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("full_name").eq("id", userId).single();
    if (data) setFullName(data.full_name);
  };

  const fetchCompanies = async (userId: string) => {
    const { data, error } = await supabase.from("companies").select("*").order("created_at", { ascending: true });
    if (error) console.error(error);
    else {
      const formattedData = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        status: item.status,
        nextDate: item.next_date || "",
        event_content: item.event_content || "",
        event_requirements: item.event_requirements || "",
        mypage_url: item.mypage_url || "",
        login_id: item.login_id || "",
        login_password: item.login_password || "",
        memo: item.memo || "",
        priority: (item.priority === "普通" ? "中" : item.priority) || "中",
        industry: item.industry || "",
      }));
      setCompanies(formattedData);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };
  const handleSignOut = async () => { await supabase.auth.signOut(); };

  const handleAddCompany = async () => {
    if (companyName === "" || !user) return;
    const { data, error } = await supabase
      .from("companies")
      .insert([{ user_id: user.id, name: companyName, status: "未エントリー", priority: "中" }])
      .select();

    if (error) alert(error.message);
    else {
      // @ts-ignore
      const newCompany: Company = {
        id: data[0].id, name: data[0].name, status: data[0].status, nextDate: "", priority: "中", industry: "",
        mypage_url: "", login_id: "", login_password: "", memo: "", event_content: "", event_requirements: ""
      };
      setCompanies([...companies, newCompany]);
      setCompanyName("");
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    const original = [...companies];
    setCompanies(companies.map(c => c.id === id ? { ...c, status: newStatus } : c));
    const { error } = await supabase.from("companies").update({ status: newStatus }).eq("id", id);
    if (error) setCompanies(original);
  };

  const handleDeleteCompany = async (id: number) => {
    if (!confirm("削除しますか？")) return;
    setCompanies(companies.filter(c => c.id !== id));
    await supabase.from("companies").delete().eq("id", id);
  };

  const handleSaveDetails = async () => {
    if (!editingCompany) return;
    setCompanies(companies.map(c => c.id === editingCompany.id ? editingCompany : c));
    const { error } = await supabase.from("companies").update({
      mypage_url: editingCompany.mypage_url,
      login_id: editingCompany.login_id,
      login_password: editingCompany.login_password,
      memo: editingCompany.memo,
      priority: editingCompany.priority,
      industry: editingCompany.industry,
    }).eq("id", editingCompany.id);
    if (error) alert("保存失敗");
    setEditingCompany(null);
  };

  const handleSaveSchedule = async () => {
    if (!schedulingCompany) return;
    const companyToSave = schedulingCompany;
    setCompanies(companies.map(c => c.id === companyToSave.id ? companyToSave : c));
    const { error } = await supabase.from("companies").update({
      next_date: companyToSave.nextDate,
      event_content: companyToSave.event_content,
      event_requirements: companyToSave.event_requirements,
    }).eq("id", companyToSave.id);
    if (error) alert("保存失敗");
    setSchedulingCompany(null);
  };

  const getTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;
    const dateStr = formatDateToLocal(date);
    const hasEvent = companies.some((c) => c.nextDate === dateStr);
    return hasEvent ? <div className="h-1.5 w-1.5 bg-blue-500 rounded-full mx-auto mt-1"></div> : null;
  };

  const getTileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return "";
    if (formatDateToLocal(date) === selectedDateStr) return "!text-white font-bold";
    const day = date.getDay();
    if (day === 6) return "!text-blue-600 font-bold dark:!text-blue-400"; // 土曜
    if (day === 0) return "!text-red-600 font-bold dark:!text-red-400";   // 日曜
    return "text-gray-700 dark:text-gray-300";
  };

  const onCalendarClick = (value: any) => {
    const clickedDate = value as Date;
    setSelectedDate(clickedDate);
    setSelectedDateStr(formatDateToLocal(clickedDate));
  };

  const totalCount = companies.length;
  const offerCount = companies.filter(c => c.status === "内定").length;
  const interviewCount = companies.filter(c => c.status.includes("面接")).length;
  const highPriorityActiveCount = companies.filter(c => c.priority === "高" && c.status !== "お見送り" && c.status !== "内定").length;

  const filteredCompanies = companies.filter((company) => {
    const searchLower = searchText.toLowerCase();
    const matchName = company.name.toLowerCase().includes(searchLower);
    const matchIndustry = company.industry?.toLowerCase().includes(searchLower);
    const matchPriority = filterPriority === "すべて" || company.priority === filterPriority || (filterPriority === "中" && company.priority === "普通");
    return (matchName || matchIndustry) && matchPriority;
  });

  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    if (!a.nextDate && !b.nextDate) return 0;
    if (!a.nextDate) return 1;
    if (!b.nextDate) return -1;
    return a.nextDate.localeCompare(b.nextDate);
  });

  const eventsOnSelectedDate = companies.filter(c => c.nextDate === selectedDateStr);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 dark:from-slate-900 dark:to-slate-800">
        <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-sm border border-white/50 dark:bg-slate-800 dark:border-slate-700">
          <div className="text-center mb-8">
            <span className="text-4xl mb-2 block">🎓</span>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">就活マネージャー</h1>
            <p className="text-sm text-gray-500 mt-2 dark:text-gray-400">すべての選考を、これひとつで。</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 ml-1 dark:text-gray-400">メールアドレス</label>
              <input type="email" placeholder="example@mail.com" className="border p-3 rounded-lg w-full bg-gray-50 focus:bg-white focus:ring-2 ring-blue-200 outline-none transition dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 ml-1 dark:text-gray-400">パスワード</label>
              <input type="password" placeholder="••••••••" className="border p-3 rounded-lg w-full bg-gray-50 focus:bg-white focus:ring-2 ring-blue-200 outline-none transition dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button onClick={handleSignIn} disabled={loading} className="bg-blue-600 text-white p-3 rounded-lg w-full font-bold shadow-lg hover:shadow-xl hover:bg-blue-700 transition transform hover:-translate-y-0.5">
              {loading ? "読み込み中..." : "ログインする"}
            </button>
            <div className="text-center mt-6 pt-4 border-t dark:border-slate-700">
              <Link href="/signup" className="text-blue-600 font-bold hover:underline text-sm dark:text-blue-400">新しくアカウントを作る →</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-sans pb-20 dark:bg-slate-950 dark:text-gray-200">

      {/* モーダル類 */}
      {schedulingCompany && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg dark:bg-slate-800 dark:border dark:border-slate-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white"><CalendarIcon className="text-blue-600 dark:text-blue-400" /> 日程登録: {schedulingCompany.name}</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-bold text-gray-600 mb-1 dark:text-gray-400">日時</label><input type="date" className="border p-2 rounded w-full dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={schedulingCompany.nextDate || ""} onChange={(e) => setSchedulingCompany({ ...schedulingCompany, nextDate: e.target.value })} /></div>
              <div><label className="block text-sm font-bold text-gray-600 mb-1 dark:text-gray-400">内容</label><input type="text" placeholder="例：会社説明会" className="border p-2 rounded w-full dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={schedulingCompany.event_content || ""} onChange={(e) => setSchedulingCompany({ ...schedulingCompany, event_content: e.target.value })} /></div>
              <div><label className="block text-sm font-bold text-gray-600 mb-1 dark:text-gray-400">持ち物</label><textarea className="border p-2 rounded w-full h-24 dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={schedulingCompany.event_requirements || ""} onChange={(e) => setSchedulingCompany({ ...schedulingCompany, event_requirements: e.target.value })} /></div>
              <div className="flex justify-end gap-2 pt-4 border-t dark:border-slate-700">
                <button onClick={() => setSchedulingCompany(null)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg dark:text-gray-400 dark:hover:bg-slate-700">キャンセル</button>
                <button onClick={handleSaveSchedule} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingCompany && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto dark:bg-slate-800 dark:border dark:border-slate-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">📝 詳細メモ: {editingCompany.name}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 dark:bg-slate-900 dark:border-slate-700">
                <div><label className="block text-xs font-bold text-gray-500 mb-1 dark:text-gray-400">志望度</label><select className="border p-2 rounded w-full bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={editingCompany.priority || "中"} onChange={(e) => setEditingCompany({ ...editingCompany, priority: e.target.value })}>{PRIORITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1 dark:text-gray-400">業界</label><input type="text" className="border p-2 rounded w-full dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={editingCompany.industry || ""} onChange={(e) => setEditingCompany({ ...editingCompany, industry: e.target.value })} /></div>
              </div>
              <div><label className="block text-sm font-bold text-gray-600 dark:text-gray-400">マイページURL</label><input type="text" className="border p-2 rounded w-full dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={editingCompany.mypage_url || ""} onChange={(e) => setEditingCompany({ ...editingCompany, mypage_url: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-sm font-bold text-gray-600 dark:text-gray-400">ID</label><input type="text" className="border p-2 rounded w-full dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={editingCompany.login_id || ""} onChange={(e) => setEditingCompany({ ...editingCompany, login_id: e.target.value })} /></div>
                <div><label className="block text-sm font-bold text-gray-600 dark:text-gray-400">PASS</label><input type="text" className="border p-2 rounded w-full dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={editingCompany.login_password || ""} onChange={(e) => setEditingCompany({ ...editingCompany, login_password: e.target.value })} /></div>
              </div>
              <div><label className="block text-sm font-bold text-gray-600 dark:text-gray-400">メモ</label><textarea className="border p-2 rounded w-full h-32 dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={editingCompany.memo || ""} onChange={(e) => setEditingCompany({ ...editingCompany, memo: e.target.value })} /></div>
              <div className="flex justify-end gap-2 pt-4 border-t dark:border-slate-700">
                <button onClick={() => setEditingCompany(null)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg dark:text-gray-400 dark:hover:bg-slate-700">キャンセル</button>
                <button onClick={handleSaveDetails} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ▼▼ ヘッダー（ボタンを削除しました） ▼▼ */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm dark:bg-slate-900/80 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎓</span>
            <h1 className="text-xl font-bold text-gray-800 hidden sm:block dark:text-white">就活マネージャー</h1>
          </div>
          <div className="flex items-center gap-4">

            {/* 名前とログアウトボタンのみ */}
            {fullName && (
              <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full dark:bg-slate-800 dark:text-white">
                <UserIcon size={16} className="text-gray-500 dark:text-gray-300" />
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{fullName}</span>
              </div>
            )}
            <button onClick={handleSignOut} className="text-gray-400 hover:text-red-500 transition-colors" title="ログアウト">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* ▼▼ ダッシュボード ▼▼ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 relative overflow-hidden dark:bg-slate-800 dark:border-slate-700">
            <div className="absolute top-0 right-0 p-2 opacity-10 dark:opacity-30 dark:text-white"><LayoutDashboard size={40} /></div>
            <p className="text-xs text-gray-500 font-bold mb-1 dark:text-gray-400">総エントリー</p>
            <p className="text-2xl font-black text-gray-800 dark:text-white">{totalCount}<span className="text-xs font-normal text-gray-400 ml-1">社</span></p>
          </div>
          <div className="bg-gradient-to-br from-sky-50 to-white p-4 rounded-xl shadow-sm border border-sky-100 relative overflow-hidden dark:from-slate-800 dark:to-slate-800 dark:border-slate-700">
            <div className="absolute top-0 right-0 p-2 opacity-10 text-sky-600 dark:opacity-30 dark:text-sky-400"><Briefcase size={40} /></div>
            <p className="text-xs text-sky-600 font-bold mb-1 dark:text-sky-400">面接中</p>
            <p className="text-2xl font-black text-sky-700 dark:text-sky-300">{interviewCount}<span className="text-xs font-normal text-sky-400 ml-1">社</span></p>
          </div>
          <div className="bg-gradient-to-br from-pink-50 to-white p-4 rounded-xl shadow-sm border border-pink-100 relative overflow-hidden dark:from-slate-800 dark:to-slate-800 dark:border-slate-700">
            <div className="absolute top-0 right-0 p-2 opacity-10 text-pink-600 dark:opacity-30 dark:text-pink-400"><CheckCircle size={40} /></div>
            <p className="text-xs text-pink-600 font-bold mb-1 dark:text-pink-400">内定</p>
            <p className="text-2xl font-black text-pink-600 dark:text-pink-300">{offerCount}<span className="text-xs font-normal text-pink-400 ml-1">社</span></p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-white p-4 rounded-xl shadow-sm border border-yellow-100 relative overflow-hidden dark:from-slate-800 dark:to-slate-800 dark:border-slate-700">
            <div className="absolute top-0 right-0 p-2 opacity-10 text-yellow-600 dark:opacity-30 dark:text-yellow-400"><Star size={40} /></div>
            <p className="text-xs text-yellow-600 font-bold mb-1 dark:text-yellow-400">第一志望 残り</p>
            <p className="text-2xl font-black text-yellow-600 dark:text-yellow-300">{highPriorityActiveCount}<span className="text-xs font-normal text-yellow-400 ml-1">社</span></p>
          </div>
        </div>

        {/* カレンダー & 予定詳細 */}
        <div className="mb-8 grid md:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 dark:bg-slate-800 dark:border-slate-700">
            <h2 className="text-center font-bold mb-4 text-gray-700 flex items-center justify-center gap-2 dark:text-white">
              <CalendarIcon size={18} /> スケジュール
            </h2>
            <div className="dark:text-white">
              <Calendar
                locale="ja-JP"
                value={selectedDate}
                onClickDay={onCalendarClick}
                tileContent={getTileContent}
                tileClassName={getTileClassName}
                className="border-none w-full !font-sans dark:!bg-slate-800 dark:!text-white"
                calendarType="gregory"
              />
            </div>
          </div>
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
                    <div key={company.id} className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 hover:bg-blue-50 transition dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <h4 className="font-bold text-gray-800 dark:text-white">{company.name}</h4>
                      </div>
                      <p className="text-sm text-blue-700 ml-4 font-medium mb-1 dark:text-blue-300">{company.event_content || "予定あり"}</p>
                      {company.event_requirements && (
                        <p className="text-xs text-gray-500 ml-4 bg-white p-2 rounded border border-gray-100 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-300">
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

        {/* 追加エリア */}
        <div className="bg-white p-2 rounded-full shadow-sm border border-gray-200 flex gap-2 mb-8 pl-4 dark:bg-slate-800 dark:border-slate-700">
          <input
            type="text"
            placeholder="新しい企業名を入力..."
            className="flex-1 bg-transparent outline-none text-sm dark:text-white"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
          <button
            onClick={handleAddCompany}
            className="bg-gray-800 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-black transition flex items-center gap-2 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            <Plus size={16} /> 追加
          </button>
        </div>

        {/* 検索・絞り込み */}
        <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="検索..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 ring-blue-100 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:ring-slate-600"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 ring-blue-100 outline-none cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="すべて">全ての志望度</option>
            {PRIORITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        {/* リスト表示 */}
        <div className="space-y-4">
          {sortedCompanies.length === 0 && (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300 dark:bg-slate-800 dark:border-slate-700">
              <p className="text-gray-400">データがありません</p>
              <p className="text-xs text-gray-300 mt-1 dark:text-gray-500">上のフォームから企業を追加してください</p>
            </div>
          )}
          {sortedCompanies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              STATUS_OPTIONS={STATUS_OPTIONS}
              onStatusChange={handleStatusChange}
              onEdit={setEditingCompany}
              onSchedule={setSchedulingCompany}
              onDelete={handleDeleteCompany}
            />
          ))}
        </div>
      </div>
    </div>
  );
}