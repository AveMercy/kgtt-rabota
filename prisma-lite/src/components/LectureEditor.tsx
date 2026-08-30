// src/components/LectureEditor.tsx

import { useState, useRef } from 'react';
import type { LectureBlock } from '@/types/lecture';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Plus, Trash2, ChevronUp, ChevronDown, Upload, X, GripVertical,
    Heading, Type, Hash, Code, Info, AlertTriangle, CheckCircle, Image, File, ImagePlus, Table, List,
} from 'lucide-react';
import { googleDrive } from '@/services/googleDrive';

interface Props {
    blocks: LectureBlock[];
    onSave: (blocks: LectureBlock[]) => void;
    onCancel: () => void;
}

const blockLabels: Record<string, string> = {
    heading: 'Заголовок', text: 'Текст', section: 'Секция', code: 'Код',
    info: 'Инфо', warning: 'Важно', success: 'Успех',
    image: 'Картинка', file: 'Файл', carousel: 'Карусель', table: 'Таблица', list: 'Список',
};

const blockIcons: Record<string, React.ElementType> = {
    heading: Heading, text: Type, section: Hash, code: Code,
    info: Info, warning: AlertTriangle, success: CheckCircle,
    image: Image, file: File, carousel: ImagePlus, table: Table, list: List,
};

const blockColors: Record<string, string> = {
    heading: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    text: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    section: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    code: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    info: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    success: 'bg-green-500/10 text-green-500 border-green-500/20',
    image: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    file: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
    carousel: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    table: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
    list: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
};

let counter = 0;
const generateId = () => `block-${Date.now()}-${++counter}`;

// Компонент для отображения прогресса загрузки
function UploadProgress({ progress, fileName }: { progress: number; fileName: string }) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="truncate">{fileName}</span>
                <span>{progress}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

function SortableBlock({ block, index, updateBlock, removeBlock, moveBlock, isFirst, isLast }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
    const Icon = blockIcons[block.type] || Type;
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadFileName, setUploadFileName] = useState('');

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleImageUpload = async (file: File) => {
        setIsUploading(true);
        setUploadFileName(file.name);
        setUploadProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            const formData = new FormData();
            formData.append('file', file);
            formData.append('cloud_name', 'sfbinsqh');
            formData.append('upload_preset', 'prisma-lite');

            const res = await fetch('https://api.cloudinary.com/v1_1/sfbinsqh/image/upload', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error?.message || 'Ошибка загрузки изображения');
            }

            clearInterval(progressInterval);
            setUploadProgress(100);

            updateBlock(index, {
                src: data.secure_url,
                alt: file.name
            });

            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
                setUploadFileName('');
            }, 500);

        } catch (error: any) {
            console.error('Ошибка загрузки:', error);
            alert('Не удалось загрузить изображение: ' + (error.message || 'неизвестная ошибка'));
            setIsUploading(false);
            setUploadProgress(0);
            setUploadFileName('');
        }
    };

    const handleFileUpload = async (file: File) => {
        setIsUploading(true);
        setUploadFileName(file.name);
        setUploadProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            const uploadedFile = await googleDrive.uploadFile(file);

            clearInterval(progressInterval);
            setUploadProgress(100);

            const fileUrl = googleDrive.getDownloadUrl(uploadedFile.id);
            updateBlock(index, {
                fileUrl: fileUrl,
                title: file.name
            });

            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
                setUploadFileName('');
            }, 500);

        } catch (error) {
            console.error('Ошибка загрузки:', error);
            alert('Не удалось загрузить файл. Попробуйте еще раз.');
            setIsUploading(false);
            setUploadProgress(0);
            setUploadFileName('');
        }
    };

    return (
        <div ref={setNodeRef} style={style} className="border rounded-xl p-4 space-y-3 bg-card">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                        <GripVertical className="h-5 w-5" />
                    </button>
                    <Badge className={`flex items-center gap-1.5 px-2.5 py-1 border ${blockColors[block.type]}`}>
                        <Icon className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">{blockLabels[block.type]}</span>
                    </Badge>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => moveBlock(index, 'up')} disabled={isFirst}>
                        <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => moveBlock(index, 'down')} disabled={isLast}>
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeBlock(index)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Контент блоков */}
            {block.type === 'heading' && (
                <div className="flex gap-2">
                    <select value={block.level || 2} onChange={(e) => updateBlock(index, { level: parseInt(e.target.value) as 1 | 2 | 3 })}
                            className="w-20 rounded-lg border bg-muted px-2 py-1 text-sm">
                        <option value={1}>H1</option><option value={2}>H2</option><option value={3}>H3</option>
                    </select>
                    <Input value={block.content || ''} onChange={(e) => updateBlock(index, { content: e.target.value })} placeholder="Заголовок..." />
                </div>
            )}

            {block.type === 'text' && (
                <Textarea
                    value={block.content || ''}
                    onChange={(e) => updateBlock(index, { content: e.target.value })}
                    placeholder="Текст..."
                    className="min-h-[80px]"
                />
            )}

            {block.type === 'section' && (
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <Input type="number" value={block.number || index + 1} onChange={(e) => updateBlock(index, { number: parseInt(e.target.value) })} className="w-20" placeholder="№" />
                        <Input value={block.title || ''} onChange={(e) => updateBlock(index, { title: e.target.value })} placeholder="Заголовок секции" />
                    </div>
                    <Textarea value={block.content || ''} onChange={(e) => updateBlock(index, { content: e.target.value })} placeholder="Содержимое..." className="min-h-[60px]" />
                </div>
            )}

            {block.type === 'code' && (
                <div className="space-y-2">
                    <Input value={block.language || ''} onChange={(e) => updateBlock(index, { language: e.target.value })} placeholder="Язык (javascript, python...)" className="w-48" />
                    <Textarea value={block.code || ''} onChange={(e) => updateBlock(index, { code: e.target.value })} placeholder="Код..." className="min-h-[100px] font-mono text-sm" />
                </div>
            )}

            {['info', 'warning', 'success'].includes(block.type) && (
                <div className="space-y-2">
                    <Input value={block.title || ''} onChange={(e) => updateBlock(index, { title: e.target.value })} placeholder="Заголовок панели" />
                    <Textarea value={block.content || ''} onChange={(e) => updateBlock(index, { content: e.target.value })} placeholder="Текст..." className="min-h-[60px]" />
                </div>
            )}

            {block.type === 'image' && (
                <div className="space-y-2">
                    {isUploading ? (
                        <div className="p-4 border-2 border-dashed rounded-xl">
                            <UploadProgress progress={uploadProgress} fileName={uploadFileName} />
                        </div>
                    ) : block.src ? (
                        <div className="relative">
                            <img src={block.src} alt={block.alt || ''} className="max-h-48 rounded-lg object-cover" />
                            <button
                                onClick={() => updateBlock(index, { src: '', alt: '' })}
                                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Загрузить изображение (Cloudinary)</span>
                            <span className="text-xs text-muted-foreground">PNG, JPG, WebP • до 10 МБ</span>
                            <input type="file" accept="image/*" className="hidden"
                                   onChange={async (e) => {
                                       const file = e.target.files?.[0];
                                       if (!file) return;
                                       await handleImageUpload(file);
                                   }}
                            />
                        </label>
                    )}
                    {block.src && !isUploading && (
                        <Input
                            value={block.alt || ''}
                            onChange={(e) => updateBlock(index, { alt: e.target.value })}
                            placeholder="Подпись (ALT текст)"
                        />
                    )}
                </div>
            )}

            {block.type === 'file' && (
                <div className="space-y-2">
                    <Input
                        value={block.title || ''}
                        onChange={(e) => updateBlock(index, { title: e.target.value })}
                        placeholder="Название файла"
                    />
                    {isUploading ? (
                        <div className="p-4 border-2 border-dashed rounded-xl">
                            <UploadProgress progress={uploadProgress} fileName={uploadFileName} />
                        </div>
                    ) : block.fileUrl ? (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                            <File className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm truncate flex-1">{block.title || 'Файл'}</span>
                            <a
                                href={block.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline text-sm"
                            >
                                Открыть
                            </a>
                            <button
                                onClick={() => updateBlock(index, { fileUrl: '', title: '' })}
                                className="text-destructive hover:text-destructive/80"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                            <Upload className="h-5 w-5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Загрузить файл (Google Drive)</span>
                            <span className="text-xs text-muted-foreground">PDF, DOCX, XLSX, ZIP • до 20 МБ</span>
                            <input type="file" accept=".pdf,.docx,.zip,.rar,.pptx,.xlsx,.txt" className="hidden"
                                   onChange={async (e) => {
                                       const file = e.target.files?.[0];
                                       if (!file) return;
                                       await handleFileUpload(file);
                                   }}
                            />
                        </label>
                    )}
                </div>
            )}

            {block.type === 'carousel' && (
                <div className="space-y-2">
                    <Label className="text-xs">Изображения карусели</Label>
                    {(block.images || []).map((img: any, i: number) => (
                        <div key={i} className="flex gap-2 items-center">
                            <Input value={img.src} onChange={(e) => {
                                const images = [...(block.images || [])]; images[i] = { ...images[i], src: e.target.value }; updateBlock(index, { images });
                            }} placeholder="URL" className="flex-1" />
                            <Input value={img.alt} onChange={(e) => {
                                const images = [...(block.images || [])]; images[i] = { ...images[i], alt: e.target.value }; updateBlock(index, { images });
                            }} placeholder="Описание" className="w-32" />
                            <Button variant="ghost" size="icon" onClick={() => {
                                updateBlock(index, { images: (block.images || []).filter((_: any, j: number) => j !== i) });
                            }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => {
                        updateBlock(index, { images: [...(block.images || []), { src: '', alt: '' }] });
                    }}><Plus className="h-3.5 mr-1" />Добавить</Button>
                </div>
            )}

            {block.type === 'table' && (
                <div className="space-y-2">
                    <Label className="text-xs">Таблица</Label>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm table-fixed">
                            <thead>
                            <tr>
                                {(block.headers || ['', '']).map((h: string, hi: number) => (
                                    <th key={hi} className="border p-1">
                                        <div className="flex gap-1 items-center">
                                            <Input value={h} onChange={(e) => {
                                                const headers = [...(block.headers || ['', ''])];
                                                headers[hi] = e.target.value; updateBlock(index, { headers });
                                            }} className="h-7 text-xs flex-1" placeholder={`Заг. ${hi + 1}`} />
                                            {(block.headers || []).length > 1 && (
                                                <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0 text-destructive" onClick={() => {
                                                    const headers = (block.headers || []).filter((_: string, i: number) => i !== hi);
                                                    const rows = (block.rows || []).map((row: string[]) => row.filter((_: string, i: number) => i !== hi));
                                                    updateBlock(index, { headers: headers.length > 0 ? headers : [''], rows: rows.length > 0 ? rows : [['']] });
                                                }}><Trash2 className="h-3 w-3" /></Button>
                                            )}
                                        </div>
                                    </th>
                                ))}
                                <th className="w-10 p-1">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                        const headers = [...(block.headers || ['', '']), ''];
                                        const rows = (block.rows || [['', '']]).map((row: string[]) => [...row, '']);
                                        updateBlock(index, { headers, rows });
                                    }}>+</Button>
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {(block.rows || [['', '']]).map((row: string[], ri: number) => (
                                <tr key={ri}>
                                    {row.map((cell: string, ci: number) => (
                                        <td key={ci} className="border p-1">
                                            <Input value={cell} onChange={(e) => {
                                                const rows = [...(block.rows || [['', '']])];
                                                rows[ri] = [...rows[ri]]; rows[ri][ci] = e.target.value; updateBlock(index, { rows });
                                            }} className="h-7 text-xs" />
                                        </td>
                                    ))}
                                    <td className="w-10 p-1">
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => {
                                            updateBlock(index, { rows: (block.rows || [['', '']]).filter((_: any, i: number) => i !== ri) });
                                        }}><Trash2 className="h-3 w-3" /></Button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => {
                        const colCount = (block.headers || ['', '']).length;
                        updateBlock(index, { rows: [...(block.rows || [['', '']]), Array(colCount).fill('')] });
                    }}><Plus className="h-3.5 mr-1" />Добавить строку</Button>
                </div>
            )}

            {block.type === 'list' && (
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <Button variant={block.listType === 'unordered' ? 'default' : 'outline'} size="sm"
                                onClick={() => updateBlock(index, { listType: 'unordered' })}>• Маркер</Button>
                        <Button variant={block.listType === 'ordered' ? 'default' : 'outline'} size="sm"
                                onClick={() => updateBlock(index, { listType: 'ordered' })}>1. Нумер</Button>
                    </div>
                    {(block.items || ['']).map((item: string, i: number) => (
                        <div key={i} className="flex gap-2 items-center">
                            <span className="text-muted-foreground text-sm w-6 text-center">
                                {block.listType === 'ordered' ? `${i + 1}.` : '•'}
                            </span>
                            <Input value={item} onChange={(e) => {
                                const items = [...(block.items || [''])];
                                items[i] = e.target.value; updateBlock(index, { items });
                            }} placeholder="Элемент списка" className="flex-1" />
                            <Button variant="ghost" size="icon" onClick={() => {
                                updateBlock(index, { items: (block.items || ['']).filter((_: any, j: number) => j !== i) });
                            }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => {
                        updateBlock(index, { items: [...(block.items || ['']), ''] });
                    }}><Plus className="h-3.5 mr-1" />Добавить пункт</Button>
                </div>
            )}
        </div>
    );
}

export default function LectureEditor({ blocks, onSave, onCancel }: Props) {
    const [editingBlocks, setEditingBlocks] = useState<LectureBlock[]>(
        blocks.map((b) => ({ ...b }))
    );
    const dragBlockType = useRef<LectureBlock['type'] | null>(null);
    const [dropIndex, setDropIndex] = useState<number | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = editingBlocks.findIndex((b) => b.id === active.id);
            const newIndex = editingBlocks.findIndex((b) => b.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                setEditingBlocks(arrayMove(editingBlocks, oldIndex, newIndex));
            }
        }
    };

    const createBlock = (type: LectureBlock['type']): LectureBlock => ({
        id: generateId(), type,
        content: '', level: type === 'heading' ? 2 : undefined,
        code: type === 'code' ? '' : undefined,
        language: type === 'code' ? 'javascript' : undefined,
        title: ['section', 'info', 'warning', 'success', 'file'].includes(type) ? '' : undefined,
        number: type === 'section' ? editingBlocks.length + 1 : undefined,
        fileUrl: type === 'file' ? '' : undefined,
        images: type === 'carousel' ? [] : undefined,
        headers: type === 'table' ? ['', ''] : undefined,
        rows: type === 'table' ? [['', '']] : undefined,
        listType: type === 'list' ? 'unordered' : undefined,
        items: type === 'list' ? [''] : undefined,
    });

    const addBlock = (type: LectureBlock['type']) => {
        setEditingBlocks([...editingBlocks, createBlock(type)]);
    };

    const handleDrop = (targetIndex: number) => {
        if (dragBlockType.current) {
            const updated = [...editingBlocks];
            updated.splice(targetIndex, 0, createBlock(dragBlockType.current));
            setEditingBlocks(updated);
            dragBlockType.current = null;
            setDropIndex(null);
        }
    };

    const updateBlock = (index: number, data: Partial<LectureBlock>) => {
        const updated = [...editingBlocks];
        updated[index] = { ...updated[index], ...data };
        setEditingBlocks(updated);
    };

    const removeBlock = (index: number) => {
        setEditingBlocks(editingBlocks.filter((_, i) => i !== index));
    };

    const moveBlock = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= editingBlocks.length) return;
        setEditingBlocks(arrayMove(editingBlocks, index, newIndex));
    };

    return (
        <div className="flex gap-6">
            {/* Левая колонка */}
            <div className="flex-1 min-w-0">
                {editingBlocks.length === 0 ? (
                    <div className="text-center text-muted-foreground py-20 border-2 border-dashed rounded-xl">
                        Добавьте блоки с помощью панели справа
                    </div>
                ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={editingBlocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-3">
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDropIndex(0); }}
                                    onDrop={() => handleDrop(0)}
                                    className={`h-2 rounded-lg transition-all ${dropIndex === 0 ? 'bg-primary/30 h-8 border-2 border-dashed border-primary' : ''}`}
                                />
                                {editingBlocks.map((block, index) => (
                                    <div key={block.id}>
                                        <SortableBlock
                                            block={block}
                                            index={index}
                                            updateBlock={updateBlock}
                                            removeBlock={removeBlock}
                                            moveBlock={moveBlock}
                                            isFirst={index === 0}
                                            isLast={index === editingBlocks.length - 1}
                                        />
                                        <div
                                            onDragOver={(e) => { e.preventDefault(); setDropIndex(index + 1); }}
                                            onDrop={() => handleDrop(index + 1)}
                                            className={`h-2 rounded-lg transition-all ${dropIndex === index + 1 ? 'bg-primary/30 h-8 border-2 border-dashed border-primary' : ''}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}

                <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
                    <Button variant="outline" onClick={onCancel}>Отмена</Button>
                    <Button onClick={() => onSave(editingBlocks)}>Сохранить</Button>
                </div>
            </div>

            {/* Правая колонка */}
            <div className="w-56 flex-shrink-0">
                <div className="sticky top-4 p-4 rounded-xl border bg-card">
                    <h3 className="text-sm font-semibold mb-2">Блоки</h3>
                    <p className="text-xs text-muted-foreground mb-3">Клик — добавить вниз. Зажать и перетащить — вставить в нужное место.</p>
                    <div className="space-y-1.5">
                        {[
                            { type: 'heading' as const, label: 'Заголовок', icon: Heading },
                            { type: 'text' as const, label: 'Текст', icon: Type },
                            { type: 'section' as const, label: 'Секция', icon: Hash },
                            { type: 'list' as const, label: 'Список', icon: List },
                            { type: 'code' as const, label: 'Код', icon: Code },
                            { type: 'info' as const, label: 'Инфо', icon: Info },
                            { type: 'warning' as const, label: 'Важно', icon: AlertTriangle },
                            { type: 'image' as const, label: 'Картинка', icon: Image },
                            { type: 'carousel' as const, label: 'Карусель', icon: ImagePlus },
                            { type: 'table' as const, label: 'Таблица', icon: Table },
                            { type: 'file' as const, label: 'Файл', icon: File },
                        ].map(({ type, label, icon: Icon }) => (
                            <div
                                key={type}
                                draggable
                                onDragStart={() => { dragBlockType.current = type; }}
                                onClick={() => addBlock(type)}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-lg border hover:bg-muted/50 cursor-grab active:cursor-grabbing transition-colors select-none"
                            >
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}