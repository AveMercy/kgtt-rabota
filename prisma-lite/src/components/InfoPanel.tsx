import { Info, AlertTriangle, CheckCircle } from 'lucide-react';

type InfoType = 'info' | 'warning' | 'success';

const icons = { info: Info, warning: AlertTriangle, success: CheckCircle };
const colors = {
    info: 'border-blue-500/30 bg-blue-500/5',
    warning: 'border-amber-500/30 bg-amber-500/5',
    success: 'border-emerald-500/30 bg-emerald-500/5',
};
const iconColors = { info: 'text-blue-400', warning: 'text-amber-400', success: 'text-emerald-400' };

interface Props {
    title?: string;
    children: React.ReactNode;
    type?: InfoType;
}

export default function InfoPanel({ title, children, type = 'info' }: Props) {
    const Icon = icons[type];
    return (
        <div className={`my-6 p-5 rounded-2xl border ${colors[type]}`}>
            <div className="flex items-start gap-3">
                <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${iconColors[type]}`} />
                <div>
                    {title && <h4 className="font-semibold mb-2">{title}</h4>}
                    <div className="text-sm text-muted-foreground">{children}</div>
                </div>
            </div>
        </div>
    );
}