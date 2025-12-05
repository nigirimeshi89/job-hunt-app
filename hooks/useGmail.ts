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

    // 手動で通知を追加する（企業追加時など）
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

    // Gmailチェックロジック
    const checkGmail = async () => {
        setCheckingMail(true);
        console.log("🚀 メール確認を開始します...");

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const providerToken = session?.provider_token;

            if (!providerToken) {
                alert("Google連携の期限切れか、権限がありません。再ログインしてください。");
                setCheckingMail(false);
                return;
            }

            const listRes = await fetch(
                "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=10",
                { headers: { Authorization: `Bearer ${providerToken}` } }
            );

            if (!listRes.ok) {
                alert("Gmailへのアクセスに失敗しました。");
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
                const detailRes = await fetch(
                    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
                    { headers: { Authorization: `Bearer ${providerToken}` } }
                );
                const detail = await detailRes.json();
                const headers = detail.payload.headers;
                const fromHeader = headers.find((h: any) => h.name === "From")?.value || "";
                const subject = headers.find((h: any) => h.name === "Subject")?.value || "(件名なし)";

                // 照合
                const matchedCompany = companies.find((c) => {
                    if (!c.contact_email) return false;
                    return fromHeader.toLowerCase().includes(c.contact_email.toLowerCase());
                });

                if (matchedCompany) {
                    await addLocalNotification(`📩 ${matchedCompany.name}からメール: ${subject}`, matchedCompany.id);
                    newCount++;
                }
            }

            if (newCount > 0) {
                alert(`${newCount}件の企業メールを見つけました！`);
            } else {
                alert("登録企業からのメールは見つかりませんでした。");
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
        addLocalNotification, // 追加時のお知らせ用に公開
    };
};