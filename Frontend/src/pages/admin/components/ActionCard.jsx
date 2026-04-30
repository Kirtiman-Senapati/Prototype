import { Link } from 'react-router-dom';

const ActionCard = ({ title, icon: Icon, to }) => {
    return (
        <Link to={to} className="block group">
            <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col items-center justify-center text-center hover:bg-slate-50 hover:border-slate-300 transition-colors h-full">
                <div className="mb-3 text-slate-400 group-hover:text-slate-600 transition-colors">
                    <Icon size={24} strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-medium text-slate-800">{title}</h3>
            </div>
        </Link>
    );
};

export default ActionCard;
