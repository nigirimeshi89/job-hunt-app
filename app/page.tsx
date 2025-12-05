"use client";

import { useState, useEffect } from "react";
import "react-calendar/dist/Calendar.css";

// 共通の型定義をインポート
import { Company, Notification, STATUS_OPTIONS } from "../types";

// カスタムフック
import { useAuth } from "../hooks/useAuth";
import { useCompanies } from "../hooks/useCompanies";
import { useGmail } from "../hooks/useGmail";

// コンポーネント
import LoginView from "../components/LoginView";
import Header from "../components/Header";
import Dashboard from "../components/Dashboard";
import CalendarView from "../components/CalendarView";
import AddCompanyForm from "../components/AddCompanyForm";
import SearchFilter from "../components/SearchFilter";
import CompanyList from "../components/CompanyList";
import ScheduleModal from "../components/ScheduleModal";
import DetailModal from "../components/DetailModal";

export default function Home() {
  // 1. 認証フック
  const { user, fullName, loading, isGoogleLinked, signIn, signInWithGoogle, signOut } = useAuth();

  // ▼▼ 修正：ログイン画面用の変数をここに復活させました！ ▼▼
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 2. データ管理フック
  const { companies, addCompany, updateCompany, deleteCompany, clearSchedule } = useCompanies(user?.id);

  // 3. Gmail・通知フック
  const { notifications, checkingMail, checkGmail, readNotification, addLocalNotification } = useGmail(user, companies);

  // 4. 画面の状態管理
  const [companyName, setCompanyName] = useState("");
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [schedulingCompany, setSchedulingCompany] = useState<Company | null>(null);
  const [searchText, setSearchText] = useState("");
  const [filterPriority, setFilterPriority] = useState("すべて");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // --- ログイン処理のラッパー関数 ---
  const handleSignIn = async () => {
    await signIn(email, password);
  };

  // --- ログイン画面の表示判定 ---
  if (!user) {
    return (
      <LoginView
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        loading={loading}
        onSignIn={handleSignIn}
        onGoogleSignIn={signInWithGoogle}
      />
    );
  }

  // --- ロジックの結合 ---
  const handleAddCompany = async () => {
    if (!companyName) return;
    await addCompany(companyName);
    await addLocalNotification(`「${companyName}」を追加しました！`);
    setCompanyName("");
  };

  // フィルタリングロジック
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

  // 集計ロジック
  const totalCount = companies.length;
  const offerCount = companies.filter(c => c.status === "内定").length;
  const interviewCount = companies.filter(c => c.status.includes("面接")).length;
  const highPriorityActiveCount = companies.filter(c => c.priority === "高" && c.status !== "お見送り" && c.status !== "内定").length;
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-sans pb-20 dark:bg-slate-950 dark:text-gray-200 overflow-x-hidden w-full">

      <ScheduleModal
        isOpen={!!schedulingCompany}
        company={schedulingCompany}
        onClose={() => setSchedulingCompany(null)}
        onSave={async () => {
          if (schedulingCompany) await updateCompany(schedulingCompany);
          setSchedulingCompany(null);
        }}
        onChange={setSchedulingCompany}
      />

      <DetailModal
        isOpen={!!editingCompany}
        company={editingCompany}
        onClose={() => setEditingCompany(null)}
        onSave={async () => {
          if (editingCompany) await updateCompany(editingCompany);
          setEditingCompany(null);
        }}
        onChange={setEditingCompany}
      />

      <Header
        fullName={fullName}
        onSignOut={signOut}
        isGoogleLinked={isGoogleLinked}
        checkingMail={checkingMail}
        onCheckGmail={checkGmail}
        notifications={notifications}
        unreadCount={unreadCount}
        onReadNotification={readNotification}
      />

      <div className="max-w-3xl mx-auto px-4 py-6">
        <Dashboard
          totalCount={totalCount}
          interviewCount={interviewCount}
          offerCount={offerCount}
          highPriorityActiveCount={highPriorityActiveCount}
        />

        <CalendarView
          companies={companies}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onEditSchedule={setSchedulingCompany}
          onClearSchedule={clearSchedule}
        />

        <AddCompanyForm
          companyName={companyName}
          setCompanyName={setCompanyName}
          onAdd={handleAddCompany}
        />

        <SearchFilter
          searchText={searchText}
          setSearchText={setSearchText}
          filterPriority={filterPriority}
          setFilterPriority={setFilterPriority}
        />

        <CompanyList
          companies={sortedCompanies}
          onStatusChange={(id, val) => updateCompany({ ...companies.find(c => c.id === id)!, status: val })}
          onEdit={setEditingCompany}
          onSchedule={setSchedulingCompany}
          onDelete={deleteCompany}
        />
      </div>
    </div>
  );
}