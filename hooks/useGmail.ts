import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";
import { Company, Notification } from "../types";

export const useGmail = (user: User | null, companies: Company[]) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [checkingMail, setCheckingMail] = useState(false);

    // 通知取得
    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .order("created_at", { ascending: false });
        if (!error) setNotifications(data || []);
    }, [user]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // 既読処理
    const readNotification = async (noteId: number) => {
        setNotifications(notifications.map((n) => (n.id === noteId ? { ...n, is_read: true } : n)));
        await supabase.from("notifications").update({ is_read: true }).eq("id", noteId);
    };

    const addLocalNotification = async (message: string, companyId?: number) => {
        if (!user) return;
        await supabase.from("notifications").insert([{
            user_id: user.id,
            company_id: companyId,
            message: message,
            is_read: false
        }]);
        fetchNotifications();
    };

    // ▼▼▼ 最強版：指名検索ロジック ▼▼▼
    const checkGmail = async () => {
        setCheckingMail(true);
        console.log("🚀 メール確認（指名検索モード）を開始...");

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const providerToken = session?.provider_token;

            if (!providerToken) {
                alert("Google連携の権限がありません。再ログインしてください。");
                setCheckingMail(false);
                return;
            }

            // 1. 検索クエリ（指名手配リスト）を作る
            // 例: "from:hr@sony.com OR from:recruit@toyota.jp OR ..."
            const targetEmails = companies
                .map(c => c.contact_email)
                .filter(email => email && email.trim() !== ""); // 空欄は除外

            if (targetEmails.length === 0) {
                alert("企業のメールアドレスが1つも登録されていません。\n詳細メモから登録してください。");
                setCheckingMail(false);
                return;
            }

            const query = targetEmails.map(email => `from:${email}`).join(" OR ");
            console.log("🔎 検索クエリ:", query);

            // 2. Gmail検索APIを叩く（最新30件ではなく、条件に合うメールを探す！）
            const listRes = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=10`,
                { headers: { Authorization: `Bearer ${providerToken}` } }
            );

            if (!listRes.ok) {
                alert("Gmailへのアクセスに失敗しました。");
                setCheckingMail(false);
                return;
            }

            const listData = await listRes.json();

            if (!listData.messages || listData.messages.length === 0) {
                alert("登録したアドレスからのメールは見つかりませんでした。");
                setCheckingMail(false);
                return;
            }

            console.log(`📨 ヒットしたメール: ${listData.messages.length} 件`);
            let newCount = 0;

            // 3. 詳細チェック
            for (const msg of listData.messages) {
                const detailRes = await fetch(
                    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
                    { headers: { Authorization: `Bearer ${providerToken}` } }
                );
                const detail = await detailRes.json();

                const headers = detail.payload.headers;
                const fromHeader = headers.find((h: any) => h.name === "From")?.value || "";
                const subject = headers.find((h: any) => h.name === "Subject")?.value || "(件名なし)";
                const snippet = detail.snippet || "";

                // どのアドレスと一致したか探す
                const matchedCompany = companies.find((c) => {
                    if (!c.contact_email) return false;
                    return fromHeader.toLowerCase().includes(c.contact_email.toLowerCase());
                });

                if (matchedCompany) {
                    // ▼ 重複チェック（今回は必要！過去のメールも拾ってくるので、通知済みならスキップ）
                    const isExist = notifications.some(n => n.message.includes(subject));

                    if (!isExist) {
                        const message = `📩 ${matchedCompany.name}: ${subject}\n\n${snippet}...`;
                        await addLocalNotification(message, matchedCompany.id);
                        newCount++;
                        console.log(`✅ 通知作成: ${subject}`);
                    } else {
                        console.log(`⚠️ 既知のメールなのでスキップ: ${subject}`);
                    }
                }
            }

            if (newCount > 0) {
                alert(`${newCount}件のメールを新しく通知に追加しました！`);
            } else {
                alert("登録アドレスからのメールは見つかりましたが、すでに全て通知済みです。");
            }

        } catch (e: any) {
            console.error(e);
            alert("エラー: " + e.message);
        }
        setCheckingMail(false);
    };

    return {
        notifications,
        checkingMail,
        checkGmail,
        readNotification,
        addLocalNotification,
    };
};