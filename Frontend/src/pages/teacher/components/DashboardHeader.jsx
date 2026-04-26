import { Layers } from "lucide-react";

const DashboardHeader = ({ title, subtitle, icon: Icon = Layers }) => {
    return (
        <div className="pt-2 pb-4">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
            <p className="text-slate-500 mt-2 font-medium">{subtitle}</p>
        </div>
    );
};

export default DashboardHeader;
