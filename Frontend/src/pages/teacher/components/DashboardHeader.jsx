import { Layers } from "lucide-react";

const DashboardHeader = ({ title, subtitle, icon: Icon = Layers }) => {
    return (
        <div className="pt-1 pb-2">
            <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">{title}</h1>
            <p className="text-slate-500 mt-1 font-medium">{subtitle}</p>
        </div>
    );
};

export default DashboardHeader;
