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
};

const STATUS_OPTIONS = [
  "未エントリー", "書類選考中", "1次面接", "2次面接", "最終面接", "内定", "お見送り",
];

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ▼▼ 新しく追加：名前を入れる変数 ▼▼
  const [fullName, setFullName] = useState("");

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [nextDate, setNextDate] = useState("");

  // 1. ログイン状態の監視（ここを修正しました！）
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCompanies(session.user.id);
        fetchProfile(session.user.id); // 👈 名前も取ってくる！
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCompanies(session.user.id);
        fetchProfile(session.user.id); // 👈 名前も取ってくる！
      } else {
        setCompanies([]);
        setFullName(""); // ログアウトしたら名前も消す
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ▼▼ 新機能：プロフィール（名前）を取得する関数 ▼▼
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles") // profilesテーブルから
      .select("full_name") // full_nameだけ欲しい
      .eq("id", userId) // 自分のIDのやつ
      .single(); // 1個だけちょうだい

    if (error) {
      console.error("プロフィール取得エラー:", error);
    } else if (data) {
      setFullName(data.full_name); // 変数にセット！
    }
  };

  const fetchCompanies = async (userId: string) => {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) console.error("データ取得エラー:", error);
    else {
      const formattedData = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        status: item.status,
        nextDate: item.next_date || "",
      }));
      setCompanies(formattedData);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("エラー: " + error.message);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleAddCompany = async () => {
    if (companyName === "" || !user) return;
    const { data, error } = await supabase
      .from("companies")
      .insert([{ user_id: user.id, name: companyName, status: "未エントリー", next_date: nextDate }])
      .select();
    if (error) alert("追加エラー: " + error.message);
    else {
      const newCompany = { id: data[0].id, name: data[0].name, status: data[0].status, nextDate: data[0].next_date || "" };
      setCompanies([...companies, newCompany]);
      setCompanyName(""); setNextDate("");
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    const originalCompanies = [...companies];
    setCompanies(companies.map(c => c.id === id ? { ...c, status: newStatus } : c));
    const { error } = await supabase.from("companies").update({ status: newStatus }).eq("id", id);
    if (error) { alert("更新失敗"); setCompanies(originalCompanies); }
  };

  const handleDateChange = async (id: number, newDate: string) => {
    const originalCompanies = [...companies];
    setCompanies(companies.map(c => c.id === id ? { ...c, nextDate: newDate } : c));
    const { error } = await supabase.from("companies").update({ next_date: newDate }).eq("id", id);
    if (error) { alert("更新失敗"); setCompanies(originalCompanies); }
  };

  const handleDeleteCompany = async (id: number) => {
    if (!confirm("削除しますか？")) return;
    setCompanies(companies.filter(c => c.id !== id));
    await supabase.from("companies").delete().eq("id", id);
  };

  const getStatusColor = (status: string) => {
    if (status === "内定") return "border-l-pink-500 bg-pink-50";
    if (status === "お見送り") return "border-l-slate-400 bg-slate-100 opacity-70";
    if (status === "最終面接") return "border-l-purple-500 bg-purple-50";
    return "border-l-blue-500 bg-blue-50";
  };

  const sortedCompanies = [...companies].sort((a, b) => {
    if (!a.nextDate && !b.nextDate) return 0;
    if (!a.nextDate) return 1;
    if (!b.nextDate) return -1;
    return a.nextDate.localeCompare(b.nextDate);
  });

  // --- 画面表示 ---

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-6 text-center">就活アプリにログイン</h1>
          <div className="space-y-4">
            <input type="email" placeholder="メールアドレス" className="border p-2 rounded w-full" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="パスワード" className="border p-2 rounded w-full" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={handleSignIn} disabled={loading} className="bg-blue-600 text-white p-2 rounded w-full font-bold hover:bg-blue-700 disabled:opacity-50">
              {loading ? "サインイン中..." : "サインイン"}
            </button>
            <div className="text-center mt-6 pt-4 border-t">
              <p className="text-sm text-gray-500 mb-2">まだアカウントをお持ちでない方</p>
              <Link href="/signup" className="text-blue-600 font-bold hover:underline">サインアップ</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* ▼▼ ヘッダー部分：ここが変わりました！ ▼▼ */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">📅 就活管理アプリ</h1>
          {/* 名前が取得できたら表示する */}
          {fullName && (
            <p className="text-sm text-gray-600 mt-1">
              ようこそ、<span className="font-bold text-blue-600">{fullName}</span> さん
            </p>
          )}
        </div>
        <button onClick={handleSignOut} className="text-sm text-red-500 underline bg-white px-3 py-1 rounded border hover:bg-gray-50">
          ログアウト
        </button>
      </div>
      {/* ▲▲ ここまで ▲▲ */}

      <div className="flex gap-2 mb-8 border-b pb-8 items-end">
        <input type="text" placeholder="企業名" className="border p-2 rounded w-full" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        <input type="date" className="border p-2 rounded" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
        <button onClick={handleAddCompany} className="bg-blue-600 text-white px-4 py-2 rounded font-bold whitespace-nowrap h-[42px]">追加</button>
      </div>

      <div className="space-y-4">
        {companies.length === 0 && <p className="text-gray-400 text-center">データがありません</p>}
        {sortedCompanies.map((company) => (
          <div key={company.id} className={`border border-l-4 p-4 rounded shadow ${getStatusColor(company.status)}`}>
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-bold">{company.name}</h2>
              <input type="date" value={company.nextDate} onChange={(e) => handleDateChange(company.id, e.target.value)} className="text-sm border rounded p-1" />
            </div>
            <div className="flex justify-between mt-4">
              <select value={company.status} onChange={(e) => handleStatusChange(company.id, e.target.value)} className="border rounded p-1 text-sm bg-white">
                {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <button onClick={() => handleDeleteCompany(company.id)} className="text-red-500 text-sm">削除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}