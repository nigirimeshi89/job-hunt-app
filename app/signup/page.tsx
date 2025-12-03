"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase"; // 相対パスに注意
import { useRouter } from "next/navigation"; // ページ移動に必要
import Link from "next/link"; // リンク用

export default function SignUpPage() {
    const router = useRouter();

    // 入力項目のState
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");       // 氏名
    const [university, setUniversity] = useState("");   // 大学名

    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        if (!email || !password || !fullName || !university) {
            alert("すべての項目を入力してください");
            return;
        }

        setLoading(true);

        // 1. まずSupabaseの認証機能でユーザー登録
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            alert("登録エラー: " + authError.message);
            setLoading(false);
            return;
        }

        if (authData.user) {
            // 2. 登録成功したら、さらに「profiles」テーブルに氏名と大学名を保存
            const { error: profileError } = await supabase
                .from("profiles")
                .insert([
                    {
                        id: authData.user.id, // ユーザーID
                        full_name: fullName,
                        university_name: university,
                    }
                ]);

            if (profileError) {
                alert("プロフィールの保存に失敗しました: " + profileError.message);
            } else {
                alert("登録完了！トップページへ移動します。");
                router.push("/"); // トップページ（ログイン画面）へ飛ばす
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">
                    新規アカウント作成
                </h1>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">氏名</label>
                        <input
                            type="text"
                            className="border p-2 rounded w-full"
                            placeholder="就活 太郎"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">大学名</label>
                        <input
                            type="text"
                            className="border p-2 rounded w-full"
                            placeholder="〇〇大学"
                            value={university}
                            onChange={(e) => setUniversity(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">メールアドレス (ID)</label>
                        <input
                            type="email"
                            className="border p-2 rounded w-full"
                            placeholder="example@mail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">パスワード</label>
                        <input
                            type="password"
                            className="border p-2 rounded w-full"
                            placeholder="6文字以上"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleSignUp}
                        disabled={loading}
                        className="bg-blue-600 text-white p-3 rounded w-full font-bold hover:bg-blue-700 mt-4 disabled:opacity-50"
                    >
                        {loading ? "登録処理中..." : "サインアップ"}
                    </button>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">すでにアカウントをお持ちですか？</p>
                    <Link href="/" className="text-blue-500 underline font-bold">
                        サインイン
                    </Link>
                </div>
            </div>
        </div>
    );
}