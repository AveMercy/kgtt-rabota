// src/components/LectureFileUploader.tsx

import { FileUploader } from './FileUploader';
import { googleDrive } from '@/services/googleDrive';

interface LectureFileUploaderProps {
    onImageUpload: (url: string, fileId: string) => void;
    onFileUpload: (url: string, fileId: string) => void;
    blockId: string;
}

export function LectureFileUploader({ onImageUpload, onFileUpload, blockId }: LectureFileUploaderProps) {
    return (
        <div className="flex gap-2">
            <FileUploader
                type="image"
                accept="image/*"
                maxSize={10}
                onUpload={(url, fileId) => onImageUpload(url, fileId)}
                className="flex-1"
            />
            <FileUploader
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                maxSize={20}
                onUpload={(url, fileId) => onFileUpload(url, fileId)}
                className="flex-1"
            />
        </div>
    );
}