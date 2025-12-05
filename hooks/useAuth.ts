import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [isGoogleLinked, setIsGoogleLinked] = useState(false);

    // プロフィール取得
    const fetchProfile = async (userId: string) => {
        const { data } = await supabase.from("profiles").select("full_name").eq("id", userId).single();
        if (data) setFullName(data.full_name);
    };

    // セッション管理
    useEffect(() => {
        const handleSession = (currentUser: User | null) => {
            setUser(currentUser);
            if (currentUser) {
                fetchProfile(currentUser.id);
                const providers = currentUser.app_metadata.providers || [];
                setIsGoogleLinked(providers.includes("google"));
            } else {
                setFullName("");
                setIsGoogleLinked(false);
            }
        };

        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            handleSession(session?.user ?? null);
        };
        init();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            handleSession(session?.user ?? null);
        });
        return () => subscription.unsubscribe();
    }, []);

    // ログイン関数
    const signIn = async (email: string, password: string) => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert(error.message);
        setLoading(false);
    };

    // Googleログイン
    const signInWithGoogle = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: location.origin,
                scopes: "https://www.googleapis.com/auth/gmail.readonly",
                queryParams: { access_type: "offline", prompt: "consent" },
            },
        });
        if (error) {
            alert(error.message);
            setLoading(false);
        }
    };

    // ログアウト
    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return {
        user,
        fullName,
        loading,
        isGoogleLinked,
        signIn,
        signInWithGoogle,
        signOut,
    };
};