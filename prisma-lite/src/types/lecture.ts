export type BlockType = 'heading' | 'text' | 'section' | 'code' | 'info' | 'warning' | 'success' | 'image' | 'file' | 'carousel' | 'table' | 'list';

export interface LectureBlock {
    id: string;
    type: BlockType;
    content?: string;
    level?: 1 | 2 | 3;
    title?: string;
    number?: number;
    language?: string;
    code?: string;
    src?: string;
    alt?: string;
    fileUrl?: string;
    fileName?: string;
    images?: { src: string; alt: string }[];
    headers?: string[];
    rows?: string[][];
    listType?: 'unordered' | 'ordered';
    items?: string[];
}
export interface Lecture {
    id: string;
    title: string;
    type: 'theory' | 'practice';
    blocks: LectureBlock[];
}

export interface Module {
    id: string;
    title: string;
    lectures: Lecture[];
}

export interface Course {
    id: string;
    title: string;
    description: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    tags: string[];
    modules: Module[];
}