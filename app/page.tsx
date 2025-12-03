"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

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
    setCompanies(companies.map(c => c.id === schedulingCompany.id ? schedulingCompany : c));

    const { error } = await supabase.from("companies").update({
      next_date: schedulingCompany.nextDate,
      event_content: schedulingCompany.event_content,
      event_requirements: schedulingCompany.event_requirements,
    }).eq("id", schedulingCompany.id);

    if (error) alert("保存失敗");
    setSchedulingCompany(null);
  };

  const getStatusColor = (status: string) => {
    if (status === "内定") return "border-l-pink-500 bg-pink-50";
    if (status === "お見送り") return "border-l-slate-400 bg-slate-100 opacity-70";
    if (status === "最終面接") return "border-l-purple-500 bg-purple-50";
    return "border-l-blue-500 bg-blue-50";
  };
  const getPriorityIcon = (priority: string) => {
    if (priority === "高") return "⭐⭐⭐";
    if (priority === "中" || priority === "普通") return "⭐⭐";
    return "⭐";
  };

  // ▼▼ 新機能：残り日数を計算する関数 ▼▼
  const getDaysRemaining = (dateStr: string) => {
    if (!dateStr) return null;

    // 今日の日付（時間を00:00:00にリセットして日付だけで比較）
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ターゲットの日付（YYYY-MM-DDを分解してセット）
    const [y, m, d] = dateStr.split('-').map(Number);
    const target = new Date(y, m - 1, d); // 月は0始まりなので-1

    // 差分を計算（ミリ秒）
    const diffTime = target.getTime() - today.getTime();
    // 日数に変換
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  // ▼▼ 新機能：カウントダウンバッジの見た目を作る関数 ▼▼
  const CountdownBadge = ({ dateStr }: { dateStr: string }) => {
    const days = getDaysRemaining(dateStr);

    if (days === null) return null;

    if (days < 0) {
      return <span className="text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded">終了</span>;
    }
    if (days === 0) {
      return <span className="text-xs bg-red-500 text-white font-bold px-2 py-1 rounded animate-pulse">🔥 今日！</span>;
    }
    if (days === 1) {
      return <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-1 rounded">あと1日！</span>;
    }
    if (days <= 3) {
      return <span className="text-xs bg-orange-100 text-orange-600 font-bold px-2 py-1 rounded">あと{days}日</span>;
    }
    return <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">あと{days}日</span>;
  };


  const getTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;
    const dateStr = formatDateToLocal(date);
    const hasEvent = companies.some((c) => c.nextDate === dateStr);
    return hasEvent ? <div className="h-2 w-2 bg-blue-500 rounded-full mx-auto mt-1"></div> : null;
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
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-6 text-center">就活アプリにログイン</h1>
          <div className="space-y-4">
            <input type="email" placeholder="メール" className="border p-2 rounded w-full" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="パスワード" className="border p-2 rounded w-full" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={handleSignIn} disabled={loading} className="bg-blue-600 text-white p-2 rounded w-full font-bold">ログイン</button>
            <div className="text-center mt-6 pt-4 border-t">
              <Link href="/signup" className="text-blue-600 font-bold hover:underline">新規登録はこちら</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto relative">

      {/* スケジュール入力モーダル */}
      {schedulingCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">📅 {schedulingCompany.name} の日程登録</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-bold text-gray-700">日時</label><input type="date" className="border p-2 rounded w-full" value={schedulingCompany.nextDate || ""} onChange={(e) => setSchedulingCompany({ ...schedulingCompany, nextDate: e.target.value })} /></div>
              <div><label className="block text-sm font-bold text-gray-700">内容</label><input type="text" placeholder="例：会社説明会、一次面接" className="border p-2 rounded w-full" value={schedulingCompany.event_content || ""} onChange={(e) => setSchedulingCompany({ ...schedulingCompany, event_content: e.target.value })} /></div>
              <div><label className="block text-sm font-bold text-gray-700">必要事項・持ち物</label><textarea className="border p-2 rounded w-full h-24" placeholder="例：履歴書、筆記用具、私服OK" value={schedulingCompany.event_requirements || ""} onChange={(e) => setSchedulingCompany({ ...schedulingCompany, event_requirements: e.target.value })} /></div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button onClick={() => setSchedulingCompany(null)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded">キャンセル</button>
                <button onClick={handleSaveSchedule} className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">保存する</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 詳細メモモーダル */}
      {editingCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingCompany.name} の詳細</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded">
                <div>
                  <label className="block text-sm font-bold text-gray-700">志望度</label>
                  <select className="border p-2 rounded w-full mt-1" value={editingCompany.priority || "中"} onChange={(e) => setEditingCompany({ ...editingCompany, priority: e.target.value })}>
                    {PRIORITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-bold text-gray-700">業界 / タグ</label><input type="text" placeholder="IT, メーカーなど" className="border p-2 rounded w-full mt-1" value={editingCompany.industry || ""} onChange={(e) => setEditingCompany({ ...editingCompany, industry: e.target.value })} /></div>
              </div>
              <div><label className="block text-sm font-bold text-gray-700">マイページURL</label><input type="text" className="border p-2 rounded w-full" value={editingCompany.mypage_url || ""} onChange={(e) => setEditingCompany({ ...editingCompany, mypage_url: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-sm font-bold text-gray-700">ID</label><input type="text" className="border p-2 rounded w-full" value={editingCompany.login_id || ""} onChange={(e) => setEditingCompany({ ...editingCompany, login_id: e.target.value })} /></div>
                <div><label className="block text-sm font-bold text-gray-700">PASS</label><input type="text" className="border p-2 rounded w-full" value={editingCompany.login_password || ""} onChange={(e) => setEditingCompany({ ...editingCompany, login_password: e.target.value })} /></div>
              </div>
              <div><label className="block text-sm font-bold text-gray-700">メモ</label><textarea className="border p-2 rounded w-full h-32" value={editingCompany.memo || ""} onChange={(e) => setEditingCompany({ ...editingCompany, memo: e.target.value })} /></div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button onClick={() => setEditingCompany(null)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded">キャンセル</button>
                <button onClick={handleSaveDetails} className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">保存する</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">📅 就活アプリ (Cloud)</h1>
          {fullName && <p className="text-sm text-gray-600 mt-1">ようこそ、<span className="font-bold text-blue-600">{fullName}</span> さん</p>}
        </div>
        <button onClick={handleSignOut} className="text-sm text-red-500 underline bg-white px-3 py-1 rounded border hover:bg-gray-50">ログアウト</button>
      </div>

      {/* ダッシュボード */}
      <div className="grid grid-cols-4 gap-2 mb-8">
        <div className="bg-blue-50 p-3 rounded text-center border border-blue-100">
          <p className="text-xs text-gray-500 font-bold">総エントリー</p>
          <p className="text-xl font-bold text-blue-600">{totalCount}<span className="text-xs ml-1">社</span></p>
        </div>
        <div className="bg-sky-50 p-3 rounded text-center border border-sky-100">
          <p className="text-xs text-gray-500 font-bold">面接中</p>
          <p className="text-xl font-bold text-sky-600">{interviewCount}<span className="text-xs ml-1">社</span></p>
        </div>
        <div className="bg-pink-50 p-3 rounded text-center border border-pink-100">
          <p className="text-xs text-gray-500 font-bold">内定</p>
          <p className="text-xl font-bold text-pink-500">{offerCount}<span className="text-xs ml-1">社</span></p>
        </div>
        <div className="bg-yellow-50 p-3 rounded text-center border border-yellow-100">
          <p className="text-xs text-gray-500 font-bold">第一志望</p>
          <p className="text-xl font-bold text-yellow-600">{highPriorityActiveCount}<span className="text-xs ml-1">社</span></p>
        </div>
      </div>

      {/* カレンダー表示 */}
      <div className="mb-8 flex flex-col md:flex-row gap-6">
        <div className="p-4 bg-white rounded shadow border border-gray-200 flex-1">
          <h2 className="text-center font-bold mb-4 text-gray-700">スケジュール</h2>
          <Calendar
            locale="ja-JP"
            value={selectedDate}
            onClickDay={onCalendarClick}
            tileContent={getTileContent}
            className="rounded-lg border-none w-full mx-auto"
          />
        </div>
        <div className="flex-1 bg-white p-4 rounded shadow border border-gray-200 min-h-[300px]">
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">
            {selectedDateStr} の予定
          </h3>
          {eventsOnSelectedDate.length === 0 ? (
            <p className="text-gray-400 text-sm">予定はありません</p>
          ) : (
            <div className="space-y-4">
              {eventsOnSelectedDate.map(company => (
                <div key={company.id} className="bg-blue-50 p-3 rounded border border-blue-100">
                  <h4 className="font-bold text-blue-700 text-lg mb-1">{company.name}</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded font-bold">内容</span>
                    <span>{company.event_content || "未定"}</span>
                  </div>
                  {company.event_requirements && (
                    <div className="mt-2 text-sm bg-white p-2 rounded border border-blue-100 text-gray-600">
                      <p className="font-bold text-xs text-gray-400 mb-1">持ち物・必要事項:</p>
                      <p className="whitespace-pre-wrap">{company.event_requirements}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 追加エリア */}
      <div className="flex gap-2 mb-6 border-b pb-6 items-end">
        <input type="text" placeholder="企業名" className="border p-2 rounded w-full" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        <button onClick={handleAddCompany} className="bg-blue-600 text-white px-4 py-2 rounded font-bold whitespace-nowrap h-[42px]">追加</button>
      </div>

      {/* 検索・絞り込み */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg flex gap-4 flex-wrap">
        <div className="flex-1">
          <label className="text-xs text-gray-500 font-bold">キーワード検索</label>
          <input type="text" placeholder="企業名や業界で検索..." className="border p-2 rounded w-full text-sm" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
        </div>
        <div className="w-32">
          <label className="text-xs text-gray-500 font-bold">志望度で絞り込み</label>
          <select className="border p-2 rounded w-full text-sm bg-white" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="すべて">すべて</option>
            {PRIORITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      {/* リスト表示 */}
      <div className="space-y-4">
        {sortedCompanies.length === 0 && (
          <p className="text-gray-400 text-center py-8">{companies.length === 0 ? "データがありません" : "条件に一致する企業が見つかりません"}</p>
        )}
        {sortedCompanies.map((company) => (
          <div key={company.id} className={`border border-l-4 p-4 rounded shadow ${getStatusColor(company.status)}`}>
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{company.name}</h2>
                {company.industry && <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">{company.industry}</span>}
              </div>

              <div className="flex items-center gap-2">
                {/* ▼▼ ここにカウントダウンと日付を表示 ▼▼ */}
                {company.nextDate ? (
                  <div className="text-right">
                    <CountdownBadge dateStr={company.nextDate} />
                    <div className="text-xs text-gray-500 mt-1">{company.nextDate}</div>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">未定</span>
                )}

                <button
                  onClick={() => setSchedulingCompany(company)}
                  className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded hover:bg-green-200 font-bold h-8"
                >
                  📅 日程入力
                </button>
              </div>

            </div>

            <div className="mb-2 text-sm text-orange-400 font-bold">
              志望度: {getPriorityIcon(company.priority)}
            </div>

            <div className="flex justify-between mt-4">
              <select value={company.status} onChange={(e) => handleStatusChange(company.id, e.target.value)} className="border rounded p-1 text-sm bg-white">
                {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <div className="flex gap-3">
                <button onClick={() => setEditingCompany(company)} className="text-blue-600 text-sm hover:underline font-bold">詳細・メモ</button>
                <button onClick={() => handleDeleteCompany(company.id)} className="text-red-500 text-sm hover:underline">削除</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}