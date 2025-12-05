import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { Company } from "../types";

export const useCompanies = (userId: string | undefined) => {
    const [companies, setCompanies] = useState<Company[]>([]);

    // データの取得
    const fetchCompanies = useCallback(async () => {
        if (!userId) return;

        const { data, error } = await supabase
            .from("companies")
            .select("*")
            .order("created_at", { ascending: true });

        if (error) {
            // ▼▼▼ エラーの詳細を表示するように改良！ ▼▼▼
            console.error("Error fetching companies:", error.message, error.details, error.hint);
            return;
        }

        if (data) {
            // DBのカラム名(スネークケース)をアプリの型(キャメルケース)に変換
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
    }, [userId]);

    // ユーザーIDが変わったら再取得
    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    // 追加
    const addCompany = async (name: string) => {
        if (!userId) return;
        const { data, error } = await supabase
            .from("companies")
            .insert([{ user_id: userId, name: name, status: "エントリー済", priority: "中" }])
            .select();

        if (error) {
            alert(error.message);
            return;
        }

        // 追加したデータを即座にstateに反映
        const newCompany: Company = {
            // @ts-ignore
            id: data[0].id, name: data[0].name, status: data[0].status,
            nextDate: "", nextTime: "", nextEndTime: "", priority: "中", industry: "",
            mypage_url: "", login_id: "", login_password: "", memo: "", event_content: "", event_requirements: "", contact_email: ""
        };
        setCompanies([...companies, newCompany]);
    };

    // 更新（ステータス変更、詳細保存、スケジュール保存など全部これ1つでOK！）
    const updateCompany = async (updatedCompany: Company) => {
        // 先に画面を更新（サクサク動かすため）
        setCompanies(companies.map(c => c.id === updatedCompany.id ? updatedCompany : c));

        const { error } = await supabase.from("companies").update({
            status: updatedCompany.status,
            next_date: updatedCompany.nextDate,
            next_time: updatedCompany.nextTime,
            next_end_time: updatedCompany.nextEndTime,
            event_content: updatedCompany.event_content,
            event_requirements: updatedCompany.event_requirements,
            mypage_url: updatedCompany.mypage_url,
            login_id: updatedCompany.login_id,
            login_password: updatedCompany.login_password,
            memo: updatedCompany.memo,
            priority: updatedCompany.priority,
            industry: updatedCompany.industry,
            contact_email: updatedCompany.contact_email,
        }).eq("id", updatedCompany.id);

        if (error) {
            console.error("Update error:", error.message);
            alert("保存に失敗しました");
            fetchCompanies(); // エラーが出たら元に戻すために再取得
        }
    };

    // 削除
    const deleteCompany = async (id: number) => {
        if (!confirm("削除しますか？")) return;
        setCompanies(companies.filter(c => c.id !== id));

        const { error } = await supabase.from("companies").delete().eq("id", id);
        if (error) {
            console.error("Delete error:", error.message);
            alert("削除に失敗しました");
            fetchCompanies();
        }
    };

    // スケジュールクリア
    const clearSchedule = async (company: Company) => {
        if (!confirm("この予定を削除しますか？")) return;
        const clearedCompany = {
            ...company,
            nextDate: "", nextTime: "", nextEndTime: "", event_content: "", event_requirements: ""
        };
        updateCompany(clearedCompany);
    };

    return {
        companies,
        setCompanies,
        fetchCompanies,
        addCompany,
        updateCompany,
        deleteCompany,
        clearSchedule,
    };
};