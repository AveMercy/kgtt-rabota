// src/pages/Catalog.tsx

import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { coursesStore } from '@/store/coursesStore';
import { useAdmin } from '@/hooks/useAdmin';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BookOpen, Plus, Upload, X, Pencil, Download } from 'lucide-react';
import type { Course } from '@/types/lecture';
import { googleDrive } from '@/services/googleDrive'; // <-- Новый импорт
import { FileUploader } from '@/components/FileUploader'; // <-- Новый импорт
import { GoogleAuth } from '@/components/GoogleAuth';

const levelLabels: Record<string, string> = { beginner: 'Начинающий', intermediate: 'Средний', advanced: 'Продвинутый' };

export default function Catalog() {
    const isAdmin = useAdmin();
    const [courses, setCourses] = useState<Course[]>([]);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [courseImage, setCourseImage] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);

    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editImage, setEditImage] = useState('');

    const refresh = () => setCourses(coursesStore.getAll());
    useEffect(() => { refresh(); }, []);

    const handleCreate = () => {
        if (newTitle.trim()) {
            coursesStore.createCourse({
                title: newTitle,
                description: newDesc,
                level: 'beginner',
                imageUrl: courseImage
            });
            setNewTitle('');
            setNewDesc('');
            setCourseImage('');
            setDialogOpen(false);
            refresh();
        }
    };

    const handleExport = () => {
        const data = localStorage.getItem('prisma-lite-admin-edit') || localStorage.getItem('prisma-lite-courses');
        if (!data) {
            alert('Нет данных для экспорта');
            return;
        }
        const blob = new Blob([data], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'courses.json';
        a.click();
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Курсы</h1>
                    <p className="text-muted-foreground">Материалы лекций и практических занятий</p>
                </div>
                {isAdmin && (
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleExport}>
                            <Download className="h-4 w-4 mr-2" />Скачать JSON
                        </Button>
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <button className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
                                    <Plus className="h-4 w-4 mr-2" />Создать курс
                                </button>
                            </DialogTrigger>
                            <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
                                <DialogHeader><DialogTitle>Новый курс</DialogTitle></DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Название</label>
                                        <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Название курса" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Описание</label>
                                        <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Краткое описание" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Баннер курса</label>
                                        {courseImage ? (
                                            <div className="relative">
                                                <img src={courseImage} alt="Баннер" className="max-h-32 rounded-lg object-cover w-full" />
                                                <button
                                                    onClick={() => setCourseImage('')}
                                                    className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <FileUploader
                                                type="image"
                                                accept="image/*"
                                                maxSize={5}
                                                onUpload={(url, fileId) => {
                                                    setCourseImage(url);
                                                }}
                                                onError={(error) => {
                                                    console.error('Ошибка загрузки:', error);
                                                }}
                                            />
                                        )}
                                    </div>
                                    <Button onClick={handleCreate} disabled={!newTitle.trim()}>Создать</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                    <Link key={course.id} to={'/course/' + course.id}>
                        <Card className="h-full cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 overflow-hidden relative group">
                            {isAdmin && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setEditingCourse(course);
                                        setEditTitle(course.title);
                                        setEditDesc(course.description);
                                        setEditImage(course.imageUrl || '');
                                    }}
                                    className="absolute top-2 right-2 z-10 bg-black/50 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                            )}
                            {course.imageUrl && (
                                <div className="h-32 -mx-6 -mt-6 mb-4 overflow-hidden">
                                    <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <BookOpen className="h-5 w-5 text-primary" />
                                    </div>
                                    <Badge variant="secondary">{levelLabels[course.level]}</Badge>
                                </div>
                                <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{course.description}</p>
                                <p className="text-xs text-muted-foreground">
                                    {course.modules.reduce((acc, m) => acc + m.lectures.length, 0)} лекций
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <Dialog open={!!editingCourse} onOpenChange={(open) => !open && setEditingCourse(null)}>
                <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
                    <DialogHeader><DialogTitle>Редактировать курс</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Название</label>
                            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Описание</label>
                            <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Баннер</label>
                            {editImage ? (
                                <div className="relative">
                                    <img src={editImage} alt="Баннер" className="max-h-32 rounded-lg object-cover w-full" />
                                    <button
                                        onClick={() => setEditImage('')}
                                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <FileUploader
                                    type="image"
                                    accept="image/*"
                                    maxSize={5}
                                    onUpload={(url, fileId) => {
                                        setEditImage(url);
                                    }}
                                    onError={(error) => {
                                        console.error('Ошибка загрузки:', error);
                                    }}
                                />
                            )}
                        </div>
                        <Button onClick={() => {
                            if (editingCourse && editTitle.trim()) {
                                coursesStore.updateCourse(editingCourse.id, {
                                    title: editTitle,
                                    description: editDesc,
                                    imageUrl: editImage
                                });
                                setEditingCourse(null);
                                refresh();
                            }
                        }}>Сохранить</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}