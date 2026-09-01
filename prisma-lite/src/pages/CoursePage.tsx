// src/pages/CoursePage.tsx

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { coursesStore } from '@/store/coursesStore';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import BlockRenderer from '@/components/BlockRenderer';
import LectureEditor from '@/components/LectureEditor';
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    ChevronLeft, FileText, Code, Pencil, Trash2, FilePlus, FolderPlus,
    GripVertical, Copy, Menu, X
} from 'lucide-react';
import type { Course, LectureBlock } from '@/types/lecture';

const lectureIcons: Record<string, React.ElementType> = { theory: FileText, practice: Code };

function SortableLecture({ lec, isSelected, onSelect, onDelete, courseId, moduleId, reloadCourse, onCopy }: {
    lec: any; isSelected: boolean; onSelect: () => void; onDelete: () => void;
    courseId: string; moduleId: string; reloadCourse: () => void; onCopy: (lectureId: string, moduleId: string) => void;
}) {
    const isAdmin = useAdmin();
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lec.id });
    const Icon = lectureIcons[lec.type];
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(lec.title);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleSave = () => {
        if (title.trim()) {
            coursesStore.updateLecture(courseId, moduleId, lec.id, { title });
            setEditing(false);
            reloadCourse();
        }
    };

    return (
        <div ref={setNodeRef} style={style} className="group flex items-center">
            {isAdmin && (
                <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing px-1 text-muted-foreground hover:text-foreground flex-shrink-0">
                    <GripVertical className="h-3.5 w-3.5" />
                </button>
            )}
            {editing ? (
                <div className="flex gap-1 flex-1 px-3 py-1 min-w-0">
                    <Input value={title} onChange={(e) => setTitle(e.target.value)}
                           className="h-7 text-xs" onKeyDown={(e) => e.key === 'Enter' && handleSave()} autoFocus />
                    <Button size="sm" className="h-7 text-xs flex-shrink-0" onClick={handleSave}>OK</Button>
                </div>
            ) : (
                <button
                    onClick={onSelect}
                    className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left min-w-0 ${
                        isSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'
                    }`}
                >
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="line-clamp-2">{lec.title}</span>
                </button>
            )}
            {isAdmin && !editing && (
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={(e) => {
                        e.stopPropagation();
                        const newType = lec.type === 'theory' ? 'practice' : 'theory';
                        coursesStore.updateLecture(courseId, moduleId, lec.id, { type: newType as 'theory' | 'practice' });
                        reloadCourse();
                    }} title={lec.type === 'theory' ? 'Сделать практикой' : 'Сделать теорией'} className="p-0.5">
                        {lec.type === 'theory' ? (
                            <Code className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        ) : (
                            <FileText className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        )}
                    </button>
                    <button onClick={(e) => {
                        e.stopPropagation();
                        onCopy(lec.id, moduleId);
                    }} title="Копировать в другой курс" className="p-0.5">
                        <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setEditing(true); setTitle(lec.title); }} className="p-0.5">
                        <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-0.5">
                        <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                </div>
            )}
        </div>
    );
}

function SortableModule({ module, selectedLectureId, onSelectLecture, onDeleteLecture, onAddLecture, newLectureTitle, setNewLectureTitle, addLectureForModule, setAddLectureForModule, editingModuleId, setEditingModuleId, editingModuleTitle, setEditingModuleTitle, courseId, reloadCourse, onCopyLecture }: any) {
    const isAdmin = useAdmin();
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleLectureDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = module.lectures.findIndex((l: any) => l.id === active.id);
            const newIndex = module.lectures.findIndex((l: any) => l.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                coursesStore.moveLecture(courseId, module.id, oldIndex, newIndex);
                reloadCourse();
            }
        }
    };

    return (
        <div ref={setNodeRef} style={style} className="mb-3 md:mb-4">
            <div className="flex items-center justify-between mb-1.5 md:mb-2 px-2 group">
                {isAdmin && (
                    <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mr-1 text-muted-foreground hover:text-foreground flex-shrink-0">
                        <GripVertical className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </button>
                )}
                {editingModuleId === module.id ? (
                    <div className="flex gap-1 flex-1 min-w-0">
                        <Input value={editingModuleTitle} onChange={(e) => setEditingModuleTitle(e.target.value)} className="h-7 text-xs"
                               onKeyDown={(e) => { if (e.key === 'Enter') { coursesStore.updateModule(courseId, module.id, editingModuleTitle); setEditingModuleId(null); reloadCourse(); } }} autoFocus />
                        <Button size="sm" className="h-7 text-xs flex-shrink-0" onClick={() => { coursesStore.updateModule(courseId, module.id, editingModuleTitle); setEditingModuleId(null); reloadCourse(); }}>OK</Button>
                    </div>
                ) : (
                    <>
                        <h3 className="text-[11px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1 line-clamp-1">{module.title}</h3>
                        {isAdmin && (
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button onClick={() => { setEditingModuleId(module.id); setEditingModuleTitle(module.title); }} className="p-0.5">
                                    <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </button>
                                <button onClick={() => { if (confirm('Удалить модуль?')) { coursesStore.deleteModule(courseId, module.id); reloadCourse(); } }} className="p-0.5">
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLectureDragEnd}>
                <SortableContext items={module.lectures.map((l: any) => l.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-0.5">
                        {module.lectures.map((lec: any) => (
                            <SortableLecture
                                key={lec.id}
                                lec={lec}
                                isSelected={selectedLectureId === lec.id}
                                onSelect={() => onSelectLecture(lec.id)}
                                onDelete={() => onDeleteLecture(module.id, lec.id)}
                                courseId={courseId}
                                moduleId={module.id}
                                reloadCourse={reloadCourse}
                                onCopy={onCopyLecture}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {isAdmin && (
                addLectureForModule === module.id ? (
                    <div className="mt-1 px-2 space-y-1">
                        <Input value={newLectureTitle} onChange={(e) => setNewLectureTitle(e.target.value)}
                               placeholder="Название лекции" className="h-7 text-xs"
                               onKeyDown={(e) => e.key === 'Enter' && onAddLecture(module.id, 'theory')} />
                        <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="h-6 text-xs"
                                    onClick={() => onAddLecture(module.id, 'theory')}>
                                <FileText className="h-3 w-3 mr-1" />Теория
                            </Button>
                            <Button size="sm" variant="outline" className="h-6 text-xs"
                                    onClick={() => onAddLecture(module.id, 'practice')}>
                                <Code className="h-3 w-3 mr-1" />Практика
                            </Button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setAddLectureForModule(module.id)}
                            className="flex items-center gap-1 px-3 py-1 mt-1 text-xs text-muted-foreground hover:text-foreground w-full">
                        <FilePlus className="h-3 w-3" />Добавить лекцию
                    </button>
                )
            )}
        </div>
    );
}

export default function CoursePage() {
    const { courseId } = useParams<{ courseId: string }>();
    const isAdmin = useAdmin();
    const [course, setCourse] = useState<Course | null>(null);
    const [selectedLectureId, setSelectedLectureId] = useState<string | null>(null);
    const [editingLectureId, setEditingLectureId] = useState<string | null>(null);
    const [editBlocks, setEditBlocks] = useState<LectureBlock[]>([]);
    const [newModuleTitle, setNewModuleTitle] = useState('');
    const [newLectureTitle, setNewLectureTitle] = useState('');
    const [showAddModule, setShowAddModule] = useState(false);
    const [addLectureForModule, setAddLectureForModule] = useState<string | null>(null);
    const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
    const [editingModuleTitle, setEditingModuleTitle] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [showCopyDialog, setShowCopyDialog] = useState<{ lectureId: string; moduleId: string } | null>(null);
    const [copyTargetCourse, setCopyTargetCourse] = useState('');
    const [copyTargetModule, setCopyTargetModule] = useState('');

    const reloadCourse = () => {
        if (courseId) {
            const found = coursesStore.getById(courseId);
            setCourse(found ? JSON.parse(JSON.stringify(found)) : null);
        }
    };
    useEffect(() => { reloadCourse(); }, [courseId]);
    useEffect(() => {
        window.addEventListener('focus', reloadCourse);
        return () => window.removeEventListener('focus', reloadCourse);
    }, [courseId]);

    const modulesSensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleModuleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id && course) {
            const oldIndex = course.modules.findIndex((m) => m.id === active.id);
            const newIndex = course.modules.findIndex((m) => m.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                coursesStore.moveModule(course.id, oldIndex, newIndex);
                reloadCourse();
            }
        }
    };

    if (!course) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Курс не найден</div>;

    const allLectures = course.modules.flatMap((m) => m.lectures);
    const selectedLecture = selectedLectureId ? allLectures.find((l) => l.id === selectedLectureId) : null;

    const handleAddLecture = (moduleId: string, type: 'theory' | 'practice') => {
        if (newLectureTitle.trim()) {
            coursesStore.addLecture(course.id, moduleId, { title: newLectureTitle, type });
            setNewLectureTitle(''); setAddLectureForModule(null); reloadCourse();
        }
    };

    const handleDeleteLecture = (moduleId: string, lectureId: string) => {
        coursesStore.deleteLecture(course.id, moduleId, lectureId);
        if (selectedLectureId === lectureId) setSelectedLectureId(null);
        reloadCourse();
    };

    const handleSelectLecture = (lectureId: string) => {
        setSelectedLectureId(lectureId);
        setEditingLectureId(null);
        setSidebarOpen(false); // Закрываем сайдбар на мобильных
    };

    const handleCopyLecture = (lectureId: string, moduleId: string) => {
        setShowCopyDialog({ lectureId, moduleId });
        setCopyTargetCourse('');
        setCopyTargetModule('');
    };

    return (
        <div className="flex h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] relative">
            {/* Оверлей для мобильного сайдбара */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Сайдбар */}
            <aside className={`
                fixed md:static z-40
                w-72 md:w-64 lg:w-72
                h-full
                border-r bg-card flex flex-col
                transition-transform duration-200
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0
            `}>
                <div className="p-3 md:p-4 border-b flex items-center justify-between">
                    <div className="min-w-0">
                        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                            <ChevronLeft className="h-4 w-4 flex-shrink-0" />Курсы
                        </Link>
                        <h2 className="font-semibold mt-1 md:mt-2 line-clamp-2 text-sm md:text-base">{course.title}</h2>
                    </div>
                    <button
                        className="md:hidden p-1.5 rounded-lg hover:bg-muted"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-2 md:p-3">
                        <DndContext sensors={modulesSensors} collisionDetection={closestCenter} onDragEnd={handleModuleDragEnd}>
                            <SortableContext items={course.modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                                {course.modules.map((module) => (
                                    <SortableModule
                                        key={module.id}
                                        module={module}
                                        selectedLectureId={selectedLectureId}
                                        onSelectLecture={handleSelectLecture}
                                        onDeleteLecture={handleDeleteLecture}
                                        onAddLecture={handleAddLecture}
                                        newLectureTitle={newLectureTitle}
                                        setNewLectureTitle={setNewLectureTitle}
                                        addLectureForModule={addLectureForModule}
                                        setAddLectureForModule={setAddLectureForModule}
                                        editingModuleId={editingModuleId}
                                        setEditingModuleId={setEditingModuleId}
                                        editingModuleTitle={editingModuleTitle}
                                        setEditingModuleTitle={setEditingModuleTitle}
                                        courseId={course.id}
                                        reloadCourse={reloadCourse}
                                        onCopyLecture={handleCopyLecture}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>

                        {isAdmin && (
                            showAddModule ? (
                                <div className="px-2 space-y-1">
                                    <Input value={newModuleTitle} onChange={(e) => setNewModuleTitle(e.target.value)} placeholder="Название модуля" className="h-7 text-xs"
                                           onKeyDown={(e) => { if (e.key === 'Enter' && newModuleTitle.trim()) { coursesStore.addModule(course.id, newModuleTitle); setNewModuleTitle(''); setShowAddModule(false); reloadCourse(); } }} />
                                    <div className="flex gap-1">
                                        <Button size="sm" className="h-6 text-xs" onClick={() => { if (newModuleTitle.trim()) { coursesStore.addModule(course.id, newModuleTitle); setNewModuleTitle(''); setShowAddModule(false); reloadCourse(); } }}>Добавить</Button>
                                        <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setShowAddModule(false)}>Отмена</Button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setShowAddModule(true)} className="flex items-center gap-1 px-3 py-2 text-xs text-muted-foreground hover:text-foreground w-full">
                                    <FolderPlus className="h-3 w-3" />Добавить модуль
                                </button>
                            )
                        )}
                    </div>
                </ScrollArea>
            </aside>

            {/* Основной контент */}
            <main className="flex-1 overflow-y-auto min-w-0">
                {/* Мобильная кнопка меню */}
                {!sidebarOpen && (
                    <button
                        className="md:hidden fixed top-16 left-2 z-20 bg-card border rounded-lg p-2 shadow-sm"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-4 w-4" />
                    </button>
                )}

                {selectedLecture ? (
                    <div className="max-w-4xl mx-auto px-3 md:px-8 py-4 md:py-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 md:mb-8">
                            <div>
                                <h1 className="text-xl md:text-3xl font-bold">{selectedLecture.title}</h1>
                                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                                    {selectedLecture.type === 'theory' ? 'Теория' : 'Практика'}
                                </p>
                            </div>
                            {isAdmin && editingLectureId !== selectedLecture.id && (
                                <Button variant="outline" size="sm" onClick={() => {
                                    setEditingLectureId(selectedLecture.id);
                                    setEditBlocks(JSON.parse(JSON.stringify(selectedLecture.blocks)));
                                }} className="gap-1 w-full sm:w-auto">
                                    <Pencil className="h-3.5 w-3.5" />Редактировать контент
                                </Button>
                            )}
                        </div>
                        {editingLectureId === selectedLecture.id ? (
                            <LectureEditor
                                blocks={editBlocks}
                                onSave={(newBlocks) => {
                                    const mod = course.modules.find((m) => m.lectures.some((l) => l.id === selectedLecture.id));
                                    if (mod) {
                                        coursesStore.updateLecture(course.id, mod.id, selectedLecture.id, { blocks: newBlocks });
                                        reloadCourse();
                                    }
                                    setEditingLectureId(null);
                                }}
                                onCancel={() => setEditingLectureId(null)}
                            />
                        ) : (
                            <BlockRenderer blocks={selectedLecture.blocks} />
                        )}
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm md:text-base">
                        Выберите лекцию слева
                    </div>
                )}
            </main>

            {/* Диалог копирования лекции */}
            <Dialog open={!!showCopyDialog} onOpenChange={(open) => !open && setShowCopyDialog(null)}>
                <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="max-w-[95vw] md:max-w-lg">
                    <DialogHeader><DialogTitle>Копировать лекцию</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Выберите курс и модуль, куда скопировать лекцию</p>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Курс</label>
                            <select value={copyTargetCourse} onChange={(e) => { setCopyTargetCourse(e.target.value); setCopyTargetModule(''); }}
                                    className="w-full rounded-lg border bg-muted px-3 py-2 text-sm">
                                <option value="">Выберите курс</option>
                                {coursesStore.getAll().map((c) => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                            </select>
                        </div>
                        {copyTargetCourse && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Модуль</label>
                                <select value={copyTargetModule} onChange={(e) => setCopyTargetModule(e.target.value)}
                                        className="w-full rounded-lg border bg-muted px-3 py-2 text-sm">
                                    <option value="">Выберите модуль</option>
                                    {coursesStore.getById(copyTargetCourse)?.modules.map((m) => (
                                        <option key={m.id} value={m.id}>{m.title}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <Button disabled={!copyTargetCourse || !copyTargetModule || !showCopyDialog}
                                onClick={() => {
                                    if (showCopyDialog && copyTargetCourse && copyTargetModule) {
                                        coursesStore.copyLecture(course.id, showCopyDialog.moduleId, showCopyDialog.lectureId, copyTargetCourse, copyTargetModule);
                                        setShowCopyDialog(null);
                                        setCopyTargetCourse('');
                                        setCopyTargetModule('');
                                        reloadCourse();
                                    }
                                }}>
                            Копировать
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}