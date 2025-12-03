"use client";

import { useState, useEffect } from "react";

type Company = {
  id: number;
  name: string;
  status: string;
  nextDate: string;
};

const STATUS_OPTIONS = [
  "未エントリー",
  "書類選考中",
  "1次面接",
  "2次面接",
  "最終面接",
  "内定",
  "お見送り",
];

export default function Home() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [nextDate, setNextDate] = useState("");

  // --- 保存機能 ---
  useEffect(() => {
    const savedData = localStorage.getItem("job-app-data");
    if (savedData) setCompanies(JSON.parse(savedData));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("job-app-data", JSON.stringify(companies));
  }, [companies, isLoaded]);

  // --- 追加・編集・削除機能 ---
  const handleAddCompany = () => {
    if (companyName === "") return;
    const newCompany: Company = {
      id: Date.now(),
      name: companyName,
      status: "未エントリー",
      nextDate: nextDate,
    };
    setCompanies([...companies, newCompany]);
    setCompanyName("");
    setNextDate("");
  };

  const handleStatusChange = (id: number, newStatus: string) => {
    const updatedCompanies = companies.map((company) => {
      if (company.id === id) return { ...company, status: newStatus };
      return company;
    });
    setCompanies(updatedCompanies);
  };

  const handleDateChange = (id: number, newDate: string) => {
    const updatedCompanies = companies.map((company) => {
      if (company.id === id) return { ...company, nextDate: newDate };
      return company;
    });
    setCompanies(updatedCompanies);
  };

  const handleDeleteCompany = (id: number) => {
    if (!window.confirm("本当に削除してもよろしいですか？")) return;
    const newCompanies = companies.filter((company) => company.id !== id);
    setCompanies(newCompanies);
  };

  const sortedCompanies = [...companies].sort((a, b) => {
    if (!a.nextDate && !b.nextDate) return 0;
    if (!a.nextDate) return 1;
    if (!b.nextDate) return -1;
    return a.nextDate.localeCompare(b.nextDate);
  });

  // ▼▼ 新機能：ステータスによって色を変える関数 ▼▼
  const getStatusColor = (status: string) => {
    switch (status) {
      case "未エントリー":
        return "border-l-gray-300 bg-white"; // 白っぽく
      case "書類選考中":
        return "border-l-blue-500 bg-blue-50"; // 青系
      case "1次面接":
        return "border-l-sky-500 bg-sky-50"; // 水色系
      case "2次面接":
        return "border-l-indigo-500 bg-indigo-50"; // 藍色系
      case "最終面接":
        return "border-l-purple-500 bg-purple-50"; // 紫系（重要感）
      case "内定":
        return "border-l-pink-500 bg-pink-50"; // ピンク（お祝い！）
      case "お見送り":
        return "border-l-slate-400 bg-slate-100 opacity-70"; // グレーで少し薄く
      default:
        return "border-l-gray-200 bg-white";
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📅 就活スケジュール</h1>

      {/* 入力エリア */}
      <div className="flex gap-2 mb-8 border-b pb-8 items-end">
        <div className="w-full">
          <label className="text-xs text-gray-500 block mb-1">企業名</label>
          <input
            type="text"
            className="border p-2 rounded w-full"
            placeholder="企業名を入力"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1">次回アクション日</label>
          <input
            type="date"
            className="border p-2 rounded"
            value={nextDate}
            onChange={(e) => setNextDate(e.target.value)}
          />
        </div>

        <button
          onClick={handleAddCompany}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-bold whitespace-nowrap h-[42px]"
        >
          追加
        </button>
      </div>

      {/* リスト表示エリア */}
      <div className="space-y-4">
        {sortedCompanies.length === 0 && (
          <p className="text-gray-400 text-center">まだ登録がありません</p>
        )}

        {sortedCompanies.map((company) => (
          // ▼▼ ここを変更：関数の結果(色クラス)を適用しています ▼▼
          // border-l-4 で左側に太い線をつけています
          <div
            key={company.id}
            className={`border border-l-4 p-4 rounded shadow transition ${getStatusColor(company.status)}`}
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-bold text-gray-800">{company.name}</h2>

              <div className="text-right">
                <label className="text-xs text-gray-500 block mb-1">次回予定</label>
                <input
                  type="date"
                  value={company.nextDate}
                  onChange={(e) => handleDateChange(company.id, e.target.value)}
                  className="border p-1 rounded text-sm text-gray-600 bg-white/50"
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-200 border-dashed">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">状況:</span>
                <select
                  value={company.status}
                  onChange={(e) => handleStatusChange(company.id, e.target.value)}
                  className="border rounded p-1 text-sm bg-white cursor-pointer"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => handleDeleteCompany(company.id)}
                className="text-red-500 text-sm hover:underline hover:text-red-700"
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}