"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";
import Link from "next/link";

type Company = {
  id: number;
  name: string;
  status: string;
  nextDate: string;
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

// ▼▼ 修正1：ここを「普通」から「中」に変えました ▼▼
const PRIORITY_OPTIONS = ["高", "中", "低"];

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [nextDate, setNextDate] = useState("");

  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // 検索・絞り込み用
  const [searchText, setSearchText] = useState("");
  const [filterPriority, setFilterPriority] = useState("すべて");

  useEffect(() => {
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

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("full_name").eq("id", userId).single();
    if (data) setFullName(data.full_name);
  };

  const fetchCompanies = async (userId: string) => {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) console.error(error);
    else {
      const formattedData = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        status: item.status,
        nextDate: item.next_date || "",
        mypage_url: item.mypage_url || "",
        login_id: item.login_id || "",
        login_password: item.login_password || "",
        memo: item.memo || "",
        // ▼▼ 修正2：DBに「普通」と入っていても「中」として扱う ▼▼
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleAddCompany = async () => {
    if (companyName === "" || !user) return;
    const { data, error } = await supabase
      .from("companies")
      .insert([{
        user_id: user.id,
        name: companyName,
        status: "未エントリー",
        next_date: nextDate,
        priority: "中" // ▼▼ 修正3：初期値を「中」に ▼▼
      }])
      .select();

    if (error) alert(error.message);
    else {
      // @ts-ignore
      const newCompany: Company = {
        id: data[0].id,
        name: data[0].name,
        status: data[0].status,
        nextDate: data[0].next_date || "",
        priority: "中", industry: "",
        mypage_url: "", login_id: "", login_password: "", memo: ""
      };
      setCompanies([...companies, newCompany]);
      setCompanyName(""); setNextDate("");
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    const original = [...companies];
    setCompanies(companies.map(c => c.id === id ? { ...c, status: newStatus } : c));
    const { error } = await supabase.from("companies").update({ status: newStatus }).eq("id", id);
    if (error) setCompanies(original);
  };

  const handleDateChange = async (id: number, newDate: string) => {
    const original = [...companies];
    setCompanies(companies.map(c => c.id === id ? { ...c, nextDate: newDate } : c));
    const { error } = await supabase.from("companies").update({ next_date: newDate }).eq("id", id);
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
    const { error } = await supabase
      .from("companies")
      .update({
        mypage_url: editingCompany.mypage_url,
        login_id: editingCompany.login_id,
        login_password: editingCompany.login_password,
        memo: editingCompany.memo,
        priority: editingCompany.priority,
        industry: editingCompany.industry,
      })
      .eq("id", editingCompany.id);

    if (error) alert("保存失敗");
    setEditingCompany(null);
  };

  const getStatusColor = (status: string) => {
    if (status === "内定") return "border-l-pink-500 bg-pink-50";
    if (status === "お見送り") return "border-l-slate-400 bg-slate-100 opacity-70";
    if (status === "最終面接") return "border-l-purple-500 bg-purple-50";
    return "border-l-blue-500 bg-blue-50";
  };

  // ▼▼ 修正4：星の表示ロジックを修正 ▼▼
  const getPriorityIcon = (priority: string) => {
    if (priority === "高") return "⭐⭐⭐";
    if (priority === "中" || priority === "普通") return "⭐⭐"; // 中も普通も星2つ！
    return "⭐"; // 低、その他は星1つ
  };

  // 検索・絞り込みロジック
  const filteredCompanies = companies.filter((company) => {
    const searchLower = searchText.toLowerCase();
    const matchName = company.name.toLowerCase().includes(searchLower);
    const matchIndustry = company.industry?.toLowerCase().includes(searchLower);

    // ▼▼ 修正5：フィルターのロジックも「中」に対応 ▼▼
    const matchPriority = filterPriority === "すべて" || company.priority === filterPriority || (filterPriority === "中" && company.priority === "普通");

    return (matchName || matchIndustry) && matchPriority;
  });

  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    if (!a.nextDate && !b.nextDate) return 0;
    if (!a.nextDate) return 1;
    if (!b.nextDate) return -1;
    return a.nextDate.localeCompare(b.nextDate);
  });

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
      {/* モーダル */}
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
                <div>
                  <label className="block text-sm font-bold text-gray-700">業界 / タグ</label>
                  <input type="text" placeholder="IT, メーカーなど" className="border p-2 rounded w-full mt-1" value={editingCompany.industry || ""} onChange={(e) => setEditingCompany({ ...editingCompany, industry: e.target.value })} />
                </div>
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

      {/* 追加エリア */}
      <div className="flex gap-2 mb-6 border-b pb-6 items-end">
        <input type="text" placeholder="企業名" className="border p-2 rounded w-full" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        <input type="date" className="border p-2 rounded" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
        <button onClick={handleAddCompany} className="bg-blue-600 text-white px-4 py-2 rounded font-bold whitespace-nowrap h-[42px]">追加</button>
      </div>

      {/* 検索・絞り込みエリア */}
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
              <input type="date" value={company.nextDate} onChange={(e) => handleDateChange(company.id, e.target.value)} className="text-sm border rounded p-1" />
            </div>

            {/* ▼▼ 修正：ここが星2つになります ▼▼ */}
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