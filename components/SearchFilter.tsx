import { Search } from "lucide-react";
import { PRIORITY_OPTIONS } from "../types";

type Props = {
    searchText: string;
    setSearchText: (val: string) => void;
    filterPriority: string;
    setFilterPriority: (val: string) => void;
};

export default function SearchFilter({ searchText, setSearchText, filterPriority, setFilterPriority }: Props) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6 pb-2">
            <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="検索..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 ring-blue-100 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:ring-slate-600"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                />
            </div>
            <select
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 ring-blue-100 outline-none cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-white w-full sm:w-auto"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
            >
                <option value="すべて">全ての志望度</option>
                {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        </div>
    );
}