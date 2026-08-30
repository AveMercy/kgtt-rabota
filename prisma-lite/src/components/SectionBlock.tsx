interface Props {
    number?: number;
    title?: string;
    children: React.ReactNode;
}

export default function SectionBlock({ number, title, children }: Props) {
    return (
        <section className="relative pl-12 border-l-2 border-blue-500/30 my-8">
            {number && (
                <div className="absolute -left-4 top-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-lg">
                    {number}
                </div>
            )}
            {title && <h3 className="text-2xl font-bold mb-4">{title}</h3>}
            <div className="text-muted-foreground">{children}</div>
        </section>
    );
}