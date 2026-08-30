import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SectionBlock from './SectionBlock';
import CodeBlock from './CodeBlock';
import InfoPanel from './InfoPanel';
import CarouselBlock from "@/components/CarouselBlock.tsx";
import { FileDown } from 'lucide-react';
import type { LectureBlock } from '@/types/lecture';
import { useState } from 'react';
import ImageViewer from './ImageViewer';

interface Props {
    blocks: LectureBlock[];
}

// Вспомогательная функция для преобразования ссылки Google Drive
function toDirectDriveUrl(url: string): string {
    const match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
        const fileId = match[1];
        // Пробуем thumbnail-версию
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1920`;
    }
    return url;
}

export default function BlockRenderer({ blocks }: Props) {
    if (!blocks || blocks.length === 0) {
        return <div className="text-center py-20 text-muted-foreground">Лекция пока не содержит материала</div>;
    }

    const [viewerImage, setViewerImage] = useState<string | null>(null);

    return (
        <div className="space-y-6">
            {blocks.map((block) => {
                switch (block.type) {
                    case 'heading': {
                        const level = block.level || 1;
                        const Tag = `h${level}` as keyof JSX.IntrinsicElements;
                        const sizes: Record<number, string> = {
                            1: 'text-4xl font-black mb-8',
                            2: 'text-2xl font-bold mt-10 mb-4',
                            3: 'text-xl font-semibold mt-8 mb-3'
                        };
                        return <Tag key={block.id} className={sizes[level] || sizes[2]}>{block.content}</Tag>;
                    }

                    case 'text':
                        return (
                            <p key={block.id} className="whitespace-pre-wrap">
                                {block.content || ''}
                            </p>
                        );

                    case 'list': {
                        const Tag = block.listType === 'ordered' ? 'ol' : 'ul';
                        const listClass = block.listType === 'ordered' ? 'list-decimal' : 'list-disc';
                        return (
                            <Tag key={block.id} className={`${listClass} list-inside space-y-1 ml-2`}>
                                {(block.items || []).map((item: string, i: number) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </Tag>
                        );
                    }

                    case 'section':
                        return (
                            <SectionBlock key={block.id} number={block.number} title={block.title}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.content || ''}</ReactMarkdown>
                            </SectionBlock>
                        );

                    case 'code':
                        return <CodeBlock key={block.id} language={block.language} code={block.code || ''} />;

                    case 'info':
                    case 'warning':
                    case 'success':
                        return (
                            <InfoPanel key={block.id} title={block.title} type={block.type}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.content || ''}</ReactMarkdown>
                            </InfoPanel>
                        );

                    case 'image': {
                        const imageSrc = toDirectDriveUrl(block.src || '');
                        return (
                            <figure key={block.id} className="my-6">
                                <img
                                    src={imageSrc}
                                    alt={block.alt || ''}
                                    className="rounded-xl w-full max-w-2xl cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => setViewerImage(imageSrc)}
                                />
                                {block.alt && (
                                    <figcaption className="text-sm text-muted-foreground mt-2 text-center">
                                        {block.alt}
                                    </figcaption>
                                )}
                            </figure>
                        );
                    }

                    case 'carousel':
                        return <CarouselBlock key={block.id} images={block.images || []} />;

                    case 'table':
                        return (
                            <div key={block.id} className="my-6 overflow-x-auto">
                                <table className="w-full border-collapse border border-border rounded-lg overflow-hidden">
                                    {block.headers && block.headers.length > 0 && (
                                        <thead>
                                        <tr className="bg-muted">
                                            {block.headers.map((h, i) => (
                                                <th key={i} className="border border-border px-4 py-2 text-left text-sm font-semibold">{h}</th>
                                            ))}
                                        </tr>
                                        </thead>
                                    )}
                                    <tbody>
                                    {(block.rows || []).map((row, ri) => (
                                        <tr key={ri} className={ri % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                                            {row.map((cell, ci) => (
                                                <td key={ci} className="border border-border px-4 py-2 text-sm">{cell}</td>
                                            ))}
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        );

                    case 'file':
                        return (
                            <a
                                key={block.id}
                                href={block.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors my-4"
                                download
                            >
                                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <FileDown className="h-5 w-5 text-blue-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{block.title || 'Скачать файл'}</p>
                                    <p className="text-xs text-muted-foreground">Нажмите для скачивания</p>
                                </div>
                            </a>
                        );

                    default:
                        return null;
                }
            })}

            {viewerImage && (
                <ImageViewer
                    src={viewerImage}
                    onClose={() => setViewerImage(null)}
                />
            )}
        </div>
    );
}