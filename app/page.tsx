"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase"; // 相対パスに修正済み
import { User } from "@supabase/supabase-js";

// データの型定義
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

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [nextDate, setNextDate] = useState("");

  // 1. ログイン状態の監視
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) fetchCompanies(session.user.id); // ログインしてたらデータ取得
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchCompanies(session.user.id);
      else setCompanies([]); // ログアウトしたらクリア
    });

    return () => subscription.unsubscribe();
  }, []);

  // ▼▼ 新機能：データベースからデータを取得 ▼▼
  const fetchCompanies = async (userId: string) => {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: true }); // 作成順に並べる

    if (error) console.error("データ取得エラー:", error);
    else {
      // データベースの型をアプリの型に変換
      const formattedData = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        status: item.status,
        nextDate: item.next_date || "", // DBのカラム名は next_date
      }));
      setCompanies(formattedData);
    }
  };

  // ログイン機能
  const handleSignUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert("エラー: " + error.message);
    else alert("登録しました！");
    setLoading(false);
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

  // ▼▼ 新機能：追加（データベースへ保存） ▼▼
  const handleAddCompany = async () => {
    if (companyName === "" || !user) return;

    // データベースに追加
    const { data, error } = await supabase
      .from("companies")
      .insert([
        {
          user_id: user.id, // 誰のデータか記録
          name: companyName,
          status: "未エントリー",
          next_date: nextDate,
        },
      ])
      .select();

    if (error) {
      alert("追加エラー: " + error.message);
    } else {
      // 成功したら画面のリストにも追加
      const newCompany = {
        id: data[0].id,
        name: data[0].name,
        status: data[0].status,
        nextDate: data[0].next_date || "",
      };
      setCompanies([...companies, newCompany]);
      setCompanyName("");
      setNextDate("");
    }
  };

  // ▼▼ 新機能：ステータス更新（データベースへ保存） ▼▼
  const handleStatusChange = async (id: number, newStatus: string) => {
    // まず画面を書き換えちゃう（サクサク動かすため）
    const originalCompanies = [...companies]; // 元に戻せるようにコピー
    setCompanies(companies.map(c => c.id === id ? { ...c, status: newStatus } : c));

    // 裏でデータベース通信
    const { error } = await supabase
      .from("companies")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert("更新できませんでした");
      setCompanies(originalCompanies); // エラーなら元に戻す
    }
  };

  // ▼▼ 新機能：日付更新（データベースへ保存） ▼▼
  const handleDateChange = async (id: number, newDate: string) => {
    const originalCompanies = [...companies];
    setCompanies(companies.map(c => c.id === id ? { ...c, nextDate: newDate } : c));

    const { error } = await supabase
      .from("companies")
      .update({ next_date: newDate })
      .eq("id", id);

    if (error) {
      alert("更新できませんでした");
      setCompanies(originalCompanies);
    }
  };

  // ▼▼ 新機能：削除（データベースから消す） ▼▼
  const handleDeleteCompany = async (id: number) => {
    if (!confirm("削除しますか？")) return;

    // 画面から消す
    setCompanies(companies.filter(c => c.id !== id));

    // データベースから消す
    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", id);

    if (error) alert("削除エラー: " + error.message);
  };

  // 色判定
  const getStatusColor = (status: string) => {
    if (status === "内定") return "border-l-pink-500 bg-pink-50";
    if (status === "お見送り") return "border-l-slate-400 bg-slate-100 opacity-70";
    if (status === "最終面接") return "border-l-purple-500 bg-purple-50";
    return "border-l-blue-500 bg-blue-50";
  };

  // ソート（日付順）
  const sortedCompanies = [...companies].sort((a, b) => {
    if (!a.nextDate && !b.nextDate) return 0;
    if (!a.nextDate) return 1;
    if (!b.nextDate) return -1;
    return a.nextDate.localeCompare(b.nextDate);
  });

  // --- 表示部分は前回と同じ ---
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded shadow w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-6 text-center">就活アプリにログイン</h1>
          <div className="space-y-4">
            <input type="email" placeholder="メール" className="border p-2 rounded w-full" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="パスワード(6文字以上)" className="border p-2 rounded w-full" value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={handleSignIn} disabled={loading} className="bg-blue-600 text-white p-2 rounded flex-1 font-bold">{loading ? "..." : "ログイン"}</button>
              <button onClick={handleSignUp} disabled={loading} className="bg-gray-500 text-white p-2 rounded flex-1 font-bold">新規登録</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📅 就活アプリ (Cloud)</h1>
        <button onClick={handleSignOut} className="text-sm text-red-500 underline">ログアウト</button>
      </div>

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