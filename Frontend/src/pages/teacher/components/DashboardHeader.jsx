import { Layers } from "lucide-react";

const DashboardHeader = ({ title, subtitle, icon: Icon = Layers }) => {
    return (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-64 h-64 rounded-full bg-white opacity-5 mix-blend-overlay pointer-events-none"></div>
            <div className="absolute bottom-0 right-32 -mb-16 w-32 h-32 rounded-full bg-white opacity-10 mix-blend-overlay pointer-events-none"></div>
            
            <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-5">
                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl text-white shadow-sm border border-white/20">
                        <Icon size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight mb-1">{title}</h1>
                        <p className="text-blue-100 font-medium text-sm">{subtitle}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHeader;
