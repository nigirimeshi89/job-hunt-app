"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
// カレンダー関連のインポートは CalendarView に移動したので削除
import { LogOut, Plus, Search, User as UserIcon, Bell, RefreshCw } from "lucide-react";

import CompanyCard from "../components/CompanyCard";
import Dashboard from "../components/Dashboard";
import ScheduleModal from "../components/ScheduleModal";
import DetailModal from "../components/DetailModal";
import CalendarView from "../components/CalendarView"; // 👈 追加

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

type Notification = {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  company_id?: number;
};

const STATUS_OPTIONS = [
  "未エントリー", "書類選考中", "1次面接", "2次面接", "最終面接", "内定", "お見送り",
];
const PRIORITY_OPTIONS = ["高", "中", "低"];

export default function Home() {
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

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [checkingMail, setCheckingMail] = useState(false);

  const [isGoogleLinked, setIsGoogleLinked] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCompanies(session.user.id);
        fetchProfile(session.user.id);
        fetchNotifications(session.user.id);
        const providers = session.user.app_metadata.providers || [];
        if (providers.includes('google')) {
          setIsGoogleLinked(true);
        }
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCompanies(session.user.id);
        fetchProfile(session.user.id);
        fetchNotifications(session.user.id);
        const providers = session.user.app_metadata.providers || [];
        setIsGoogleLinked(providers.includes('google'));
      } else {
        setCompanies([]);
        setFullName("");
        setNotifications([]);
        setIsGoogleLinked(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

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
        nextTime: item.next_time || "",
        nextEndTime: item.next_end_time || "",
        event_content: item.event_content || "",
        event_requirements: item.event_requirements || "",
        mypage_url: item.mypage_url || "",
        login_id: item.login_id || "",
        login_password: item.login_password || "",
        memo: item.memo || "",
        priority: (item.priority === "普通" ? "中" : item.priority) || "中",
        industry: item.industry || "",
        contact_email: item.contact_email || "",
      }));
      setCompanies(formattedData);
    }
  };

  const fetchNotifications = async (userId: string) => {
    const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false });
    if (!error) setNotifications(data || []);
  };

  const handleReadNotification = async (noteId: number) => {
    setNotifications(notifications.map(n => n.id === noteId ? { ...n, is_read: true } : n));
    await supabase.from("notifications").update({ is_read: true }).eq("id", noteId);
  };

  const checkGmail = async () => {
    setCheckingMail(true);
    console.log("🚀 メール確認を開始します...");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const providerToken = session?.provider_token;

      if (!providerToken) {
        alert("Google連携の期限切れか、権限がありません。一度ログアウトして、再度「Googleでログイン」してください。");
        setCheckingMail(false);
        return;
      }

      const listRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=10", {
        headers: { Authorization: `Bearer ${providerToken}` }
      });

      if (!listRes.ok) {
        alert("Gmailへのアクセスに失敗しました。ログアウトして権限を確認してください。");
        setCheckingMail(false);
        return;
      }

      const listData = await listRes.json();

      if (!listData.messages || listData.messages.length === 0) {
        alert("新しい未読メールはありませんでした。");
        setCheckingMail(false);
        return;
      }

      let newCount = 0;

      for (const msg of listData.messages) {
        const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
          headers: { Authorization: `Bearer ${providerToken}` }
        });
        const detail = await detailRes.json();

        const headers = detail.payload.headers;
        const fromHeader = headers.find((h: any) => h.name === "From")?.value || "";
        const subject = headers.find((h: any) => h.name === "Subject")?.value || "(件名なし)";

        const matchedCompany = companies.find(c => {
          if (!c.contact_email) return false;
          return fromHeader.toLowerCase().includes(c.contact_email.toLowerCase());
        });

        if (matchedCompany) {
          await supabase.from("notifications").insert([{
            user_id: user?.id,
            company_id: matchedCompany.id,
            message: `📩 ${matchedCompany.name}からメール: ${subject}`,
            is_read: false
          }]);
          newCount++;
        }
      }

      if (newCount > 0) {
        alert(`${newCount}件の企業メールを見つけました！通知を確認してください。`);
        fetchNotifications(user!.id);
      } else {
        alert("未読メールはありましたが、登録企業のメールアドレスと一致しませんでした。");
      }

    } catch (e: any) {
      console.error(e);
      alert("エラーが発生しました: " + e.message);
    }
    setCheckingMail(false);
  };

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: location.origin,
        scopes: 'https://www.googleapis.com/auth/gmail.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      }
    });
    if (error) {
      alert(error.message);
      setLoading(false);
    }
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
      const newCompanyId = data[0].id;
      // @ts-ignore
      const newCompany: Company = {
        id: newCompanyId, name: data[0].name, status: data[0].status, nextDate: "", nextTime: "", nextEndTime: "", priority: "中", industry: "",
        mypage_url: "", login_id: "", login_password: "", memo: "", event_content: "", event_requirements: "", contact_email: ""
      };
      setCompanies([...companies, newCompany]);
      setCompanyName("");

      await supabase.from("notifications").insert([{
        user_id: user.id,
        company_id: newCompanyId,
        message: `「${companyName}」をリストに追加しました！詳細設定からメールアドレスを登録しましょう。`,
        is_read: false
      }]);
      fetchNotifications(user.id);
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
      contact_email: editingCompany.contact_email,
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
      next_time: companyToSave.nextTime,
      next_end_time: companyToSave.nextEndTime,
      event_content: companyToSave.event_content,
      event_requirements: companyToSave.event_requirements,
    }).eq("id", companyToSave.id);
    if (error) alert("保存失敗");
    setSchedulingCompany(null);
  };

  const handleClearSchedule = async (company: Company) => {
    if (!confirm("この予定を削除しますか？")) return;
    const clearedCompany = { ...company, nextDate: "", nextTime: "", nextEndTime: "", event_content: "", event_requirements: "" };
    setCompanies(companies.map(c => c.id === company.id ? clearedCompany : c));
    const { error } = await supabase.from("companies").update({
      next_date: null,
      next_time: null,
      next_end_time: null,
      event_content: null,
      event_requirements: null,
    }).eq("id", company.id);
    if (error) alert("削除失敗");
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

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full p-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold hover:bg-gray-50 transition transform hover:-translate-y-0.5 dark:bg-white dark:text-gray-800"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Googleでログイン
            </button>
            <div className="relative flex items-center justify-center my-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-300"></span></div>
              <span className="relative bg-white px-2 text-xs text-gray-500 dark:bg-slate-800">または</span>
            </div>
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
    <div className="min-h-screen bg-slate-50 text-gray-800 font-sans pb-20 dark:bg-slate-950 dark:text-gray-200 overflow-x-hidden w-full">

      {/* モーダル類 */}
      <ScheduleModal
        isOpen={!!schedulingCompany}
        company={schedulingCompany}
        onClose={() => setSchedulingCompany(null)}
        onSave={handleSaveSchedule}
        onChange={setSchedulingCompany}
      />

      <DetailModal
        isOpen={!!editingCompany}
        company={editingCompany}
        onClose={() => setEditingCompany(null)}
        onSave={handleSaveDetails}
        onChange={setEditingCompany}
      />

      {/* ヘッダー */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm dark:bg-slate-900/80 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎓</span>
            <h1 className="text-xl font-bold text-gray-800 hidden sm:block dark:text-white">就活マネージャー</h1>
          </div>
          <div className="flex items-center gap-4">

            {/* Google連携済みの場合のみ表示 */}
            {isGoogleLinked && (
              <button
                onClick={checkGmail}
                disabled={checkingMail}
                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-bold transition-all ${checkingMail ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-200'}`}
              >
                <RefreshCw size={14} className={checkingMail ? "animate-spin" : ""} />
                {checkingMail ? "確認中..." : "メール確認"}
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-gray-500 hover:text-blue-600 transition-colors dark:text-gray-300 dark:hover:text-blue-400"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 dark:bg-slate-800 dark:border-slate-600">
                  <div className="p-3 bg-gray-50 border-b border-gray-100 font-bold text-sm text-gray-700 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200">
                    お知らせ
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-center text-gray-400 text-sm py-4">通知はありません</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => handleReadNotification(n.id)}
                          className={`p-3 text-sm border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors dark:border-slate-700 dark:hover:bg-slate-700 ${n.is_read ? 'opacity-50' : 'bg-blue-50/30 font-bold dark:bg-slate-700/50'}`}
                        >
                          <p className="text-gray-800 dark:text-gray-200">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                        </div>
                      ))
                    )}
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
            <button onClick={handleSignOut} className="text-gray-400 hover:text-red-500 transition-colors" title="ログアウト">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* ダッシュボード */}
        <Dashboard
          totalCount={totalCount}
          interviewCount={interviewCount}
          offerCount={offerCount}
          highPriorityActiveCount={highPriorityActiveCount}
        />

        {/* カレンダー & 予定リスト */}
        <CalendarView
          companies={companies}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onEditSchedule={setSchedulingCompany}
          onClearSchedule={handleClearSchedule}
        />

        {/* 追加エリア（横並びで自然なデザインに！） */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8 dark:bg-slate-800 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="新しい企業名を入力..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 ring-blue-100 transition dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:ring-slate-600"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
            <button
              onClick={handleAddCompany}
              className="bg-gray-800 text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-black transition flex items-center justify-center gap-2 dark:bg-blue-600 dark:hover:bg-blue-700 w-full sm:w-auto"
            >
              <Plus size={18} /> 追加する
            </button>
          </div>
        </div>

        {/* 検索・絞り込み */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 pb-2">
          <div className="relative flex-1">
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
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 ring-blue-100 outline-none cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-white w-full sm:w-auto"
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