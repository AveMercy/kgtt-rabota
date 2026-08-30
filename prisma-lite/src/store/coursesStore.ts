import type { Course, Module, Lecture, LectureBlock } from '@/types/lecture';
import { courses as defaultCourses } from '@/data/courses';

const STORAGE_KEY = 'prisma-lite-courses';
const ADMIN_EDIT_KEY = 'prisma-lite-admin-edit';

// Всегда загружаем из courses.ts
function loadCourses(): Course[] {
    // Проверяем, есть ли админские правки
    const adminEdit = localStorage.getItem(ADMIN_EDIT_KEY);
    if (adminEdit) {
        try {
            return JSON.parse(adminEdit);
        } catch {}
    }
    // Возвращаем дефолтные из файла
    return JSON.parse(JSON.stringify(defaultCourses));
}

function saveCourses(courses: Course[]) {
    localStorage.setItem(ADMIN_EDIT_KEY, JSON.stringify(courses));
}
let courses = loadCourses();

// Генераторы ID
let idCounter = Date.now();
function nextId(): string {
    return `id-${++idCounter}`;
}

export const coursesStore = {
    getAll: () => courses,

    getById: (id: string) => courses.find((c) => c.id === id),

    createCourse: (data: Partial<Course>) => {
        const course: Course = {
            id: nextId(),
            title: data.title || 'Новый курс',
            description: data.description || '',
            level: data.level || 'beginner',
            tags: data.tags || [],
            modules: [],
        };
        courses.push(course);
        saveCourses(courses);
        return course;
    },

    updateCourse: (id: string, data: Partial<Course>) => {
        const index = courses.findIndex((c) => c.id === id);
        if (index === -1) return;
        courses[index] = { ...courses[index], ...data };
        saveCourses(courses);
    },

    deleteCourse: (id: string) => {
        courses = courses.filter((c) => c.id !== id);
        saveCourses(courses);
    },

    addModule: (courseId: string, title: string) => {
        const course = courses.find((c) => c.id === courseId);
        if (!course) return;
        const module: Module = {
            id: nextId(),
            title,
            lectures: [],
        };
        course.modules.push(module);
        saveCourses(courses);
        return module;
    },

    updateModule: (courseId: string, moduleId: string, title: string) => {
        const course = courses.find((c) => c.id === courseId);
        if (!course) return;
        const mod = course.modules.find((m) => m.id === moduleId);
        if (!mod) return;
        mod.title = title;
        saveCourses(courses);
    },

    deleteModule: (courseId: string, moduleId: string) => {
        const course = courses.find((c) => c.id === courseId);
        if (!course) return;
        course.modules = course.modules.filter((m) => m.id !== moduleId);
        saveCourses(courses);
    },

    addLecture: (courseId: string, moduleId: string, data: Partial<Lecture>) => {
        const course = courses.find((c) => c.id === courseId);
        if (!course) return;
        const mod = course.modules.find((m) => m.id === moduleId);
        if (!mod) return;
        const lecture: Lecture = {
            id: nextId(),
            title: data.title || 'Новая лекция',
            type: data.type || 'theory',
            blocks: data.blocks || [],
        };
        mod.lectures.push(lecture);
        saveCourses(courses);
        return lecture;
    },

    updateLecture: (courseId: string, moduleId: string, lectureId: string, data: Partial<Lecture>) => {
        const course = courses.find((c) => c.id === courseId);
        if (!course) return;
        const mod = course.modules.find((m) => m.id === moduleId);
        if (!mod) return;
        const lec = mod.lectures.find((l) => l.id === lectureId);
        if (!lec) return;
        Object.assign(lec, data);
        saveCourses(courses);
    },

    deleteLecture: (courseId: string, moduleId: string, lectureId: string) => {
        const course = courses.find((c) => c.id === courseId);
        if (!course) return;
        const mod = course.modules.find((m) => m.id === moduleId);
        if (!mod) return;
        mod.lectures = mod.lectures.filter((l) => l.id !== lectureId);
        saveCourses(courses);
    },

    moveModule: (courseId: string, fromIndex: number, toIndex: number) => {
        const course = courses.find((c) => c.id === courseId);
        if (!course) return;
        const [moved] = course.modules.splice(fromIndex, 1);
        course.modules.splice(toIndex, 0, moved);
        saveCourses(courses);
    },

    moveLecture: (courseId: string, moduleId: string, fromIndex: number, toIndex: number) => {
        const course = courses.find((c) => c.id === courseId);
        if (!course) return;
        const mod = course.modules.find((m) => m.id === moduleId);
        if (!mod) return;
        const [moved] = mod.lectures.splice(fromIndex, 1);
        mod.lectures.splice(toIndex, 0, moved);
        saveCourses(courses);
    },


    copyLecture: (fromCourseId: string, fromModuleId: string, lectureId: string, toCourseId: string, toModuleId: string) => {
        const fromCourse = courses.find((c) => c.id === fromCourseId);
        if (!fromCourse) return;
        const fromModule = fromCourse.modules.find((m) => m.id === fromModuleId);
        if (!fromModule) return;
        const lecture = fromModule.lectures.find((l) => l.id === lectureId);
        if (!lecture) return;

        const toCourse = courses.find((c) => c.id === toCourseId);
        if (!toCourse) return;
        const toModule = toCourse.modules.find((m) => m.id === toModuleId);
        if (!toModule) return;

        const copiedLecture: Lecture = {
            ...JSON.parse(JSON.stringify(lecture)),
            id: nextId(),
            title: lecture.title + ' (копия)',
        };
        toModule.lectures.push(copiedLecture);
        saveCourses(courses);
    },
};