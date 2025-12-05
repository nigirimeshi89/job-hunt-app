import { Plus } from "lucide-react";

type Props = {
    companyName: string;
    setCompanyName: (val: string) => void;
    onAdd: () => void;
};

export default function AddCompanyForm({ companyName, setCompanyName, onAdd }: Props) {
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8 dark:bg-slate-800 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    placeholder="新しい企業名を入力..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 ring-blue-100 transition dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:ring-slate-600"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                />
                <button onClick={onAdd} className="bg-gray-800 text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-black transition flex items-center justify-center gap-2 dark:bg-blue-600 dark:hover:bg-blue-700 w-full sm:w-auto">
                    <Plus size={18} /> 追加する
                </button>
            </div>
        </div>
    );
}