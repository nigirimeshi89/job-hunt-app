import CompanyCard from "./CompanyCard";
import { Company, STATUS_OPTIONS } from "../types";

type Props = {
    companies: Company[];
    onStatusChange: (id: number, val: string) => void;
    onEdit: (company: Company) => void;
    onSchedule: (company: Company) => void;
    onDelete: (id: number) => void;
};

export default function CompanyList({ companies, onStatusChange, onEdit, onSchedule, onDelete }: Props) {
    return (
        <div className="space-y-4">
            {companies.length === 0 && (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300 dark:bg-slate-800 dark:border-slate-700">
                    <p className="text-gray-400">データがありません</p>
                    <p className="text-xs text-gray-300 mt-1 dark:text-gray-500">上のフォームから企業を追加してください</p>
                </div>
            )}
            {companies.map((company) => (
                <CompanyCard
                    key={company.id}
                    company={company}
                    STATUS_OPTIONS={STATUS_OPTIONS}
                    onStatusChange={onStatusChange}
                    onEdit={onEdit}
                    onSchedule={onSchedule}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}