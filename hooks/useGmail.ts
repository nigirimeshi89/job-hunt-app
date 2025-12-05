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

    // ローカル通知追加
    const addLocalNotification = async (message: string, companyId?: number, body?: string) => {
        if (!user) return;
        await supabase.from("notifications").insert([{
            user_id: user.id,
            company_id: companyId,
            message: message,
            email_body: body,
            is_read: false
        }]);
        // 追加直後にリストを更新しない（ループ中は最後にまとめて更新する方が効率的）
    };

    // Gmailチェックロジック
    const checkGmail = async () => {
        setCheckingMail(true);
        console.log("🚀 メール確認を開始...");

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const providerToken = session?.provider_token;

            if (!providerToken) {
                alert("Google連携の権限がありません。再ログインしてください。");
                setCheckingMail(false);
                return;
            }

            const targetEmails = companies
                .map(c => c.contact_email)
                .filter(email => email && email.trim() !== "");

            if (targetEmails.length === 0) {
                alert("企業のメールアドレスが登録されていません。");
                setCheckingMail(false);
                return;
            }

            const query = targetEmails.map(email => `from:${email}`).join(" OR ");

            const listRes = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=10`,
                { headers: { Authorization: `Bearer ${providerToken}` } }
            );

            if (!listRes.ok) {
                alert("Gmailアクセスエラー");
                setCheckingMail(false);
                return;
            }

            const listData = await listRes.json();

            if (!listData.messages || listData.messages.length === 0) {
                alert("該当するメールは見つかりませんでした。");
                setCheckingMail(false);
                return;
            }

            // ▼▼▼ 修正ポイント：取得したメールを「古い順」に並び替える！ ▼▼▼
            // これにより、最新のメールが「最後に」登録され、通知リストの一番上に来るようになります。
            const messages = listData.messages.reverse();

            console.log(`📨 ヒット: ${messages.length} 件`);
            let newCount = 0;

            for (const msg of messages) {
                const detailRes = await fetch(
                    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
                    { headers: { Authorization: `Bearer ${providerToken}` } }
                );
                const detail = await detailRes.json();

                // ヘッダー情報の取得
                const headers = detail.payload.headers;
                const fromHeader = headers.find((h: any) => h.name === "From")?.value || "";
                const subject = headers.find((h: any) => h.name === "Subject")?.value || "(件名なし)";

                // 本文取得（デコード処理）
                const decodeBase64 = (data: string) => {
                    try {
                        const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
                        const decoded = atob(base64);
                        const bytes = new Uint8Array(decoded.length);
                        for (let i = 0; i < decoded.length; i++) {
                            bytes[i] = decoded.charCodeAt(i);
                        }
                        return new TextDecoder().decode(bytes);
                    } catch (e) { return ""; }
                };

                const getEmailBody = (payload: any) => {
                    if (payload.body && payload.body.data) return decodeBase64(payload.body.data);
                    if (payload.parts) {
                        for (const part of payload.parts) {
                            if (part.mimeType === "text/plain" && part.body && part.body.data) return decodeBase64(part.body.data);
                        }
                    }
                    return "(本文なし)";
                };

                const bodyText = getEmailBody(detail.payload);

                const matchedCompany = companies.find((c) => {
                    if (!c.contact_email) return false;
                    return fromHeader.toLowerCase().includes(c.contact_email.toLowerCase());
                });

                if (matchedCompany) {
                    // 重複チェック
                    const isExist = notifications.some(n => n.message.includes(subject));

                    if (!isExist) {
                        const message = `📩 ${matchedCompany.name}: ${subject}`;
                        // DBに追加
                        await addLocalNotification(message, matchedCompany.id, bodyText);
                        newCount++;
                    }
                }
            }

            // 最後にまとめてリストを更新
            fetchNotifications();

            if (newCount > 0) {
                alert(`${newCount}件のメールを通知しました！`);
            } else {
                alert("メールは見つかりましたが、すでに通知済みです。");
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