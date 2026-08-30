// src/components/FileUploader.tsx

import { useState, useRef } from 'react';
import { Upload, X, File, Image, Loader2 } from 'lucide-react';
import { googleDrive } from '@/services/googleDrive';
import { Button } from '@/components/ui/button';

interface FileUploaderProps {
    onUpload: (url: string, fileId: string) => void;
    onError?: (error: Error) => void;
    accept?: string;
    maxSize?: number; // в МБ
    className?: string;
    type?: 'image' | 'file';
}

export function FileUploader({
                                 onUpload,
                                 onError,
                                 accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx',
                                 maxSize = 10, // 10 МБ по умолчанию
                                 className = '',
                                 type = 'image'
                             }: FileUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        // Проверка размера
        if (file.size > maxSize * 1024 * 1024) {
            const error = new Error(`Файл слишком большой. Максимальный размер: ${maxSize} МБ`);
            onError?.(error);
            alert(error.message);
            return;
        }

        setIsUploading(true);
        setFileInfo({
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(1) + ' МБ'
        });

        try {
            const uploadedFile = await googleDrive.uploadFile(file);

            // Получаем URL в зависимости от типа
            let url: string;
            if (type === 'image') {
                url = googleDrive.getImageUrl(uploadedFile.id);
            } else {
                url = googleDrive.getDownloadUrl(uploadedFile.id);
            }

            onUpload(url, uploadedFile.id);

            // Сбрасываем состояние
            setTimeout(() => {
                setFileInfo(null);
                setIsUploading(false);
            }, 2000);

        } catch (error) {
            console.error('Ошибка загрузки:', error);
            onError?.(error as Error);
            setFileInfo(null);
            setIsUploading(false);
            alert('Не удалось загрузить файл. Попробуйте еще раз.');
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
    };

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleRemove = () => {
        setFileInfo(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <div className={className}>
            {!fileInfo && !isUploading && (
                <div
                    className={`
            relative border-2 border-dashed rounded-lg p-6 
            ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}
            transition-colors cursor-pointer
          `}
                    onClick={handleClick}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept={accept}
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        {type === 'image' ? (
                            <Image className="h-8 w-8" />
                        ) : (
                            <File className="h-8 w-8" />
                        )}
                        <span className="text-sm font-medium">
              {dragActive ? 'Отпустите файл для загрузки' : 'Нажмите или перетащите файл'}
            </span>
                        <span className="text-xs">
              {accept.replace(/,/g, ', ')} • Макс. {maxSize} МБ
            </span>
                    </div>
                </div>
            )}

            {(fileInfo || isUploading) && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                        {isUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            type === 'image' ? <Image className="h-4 w-4" /> : <File className="h-4 w-4" />
                        )}
                        <div>
                            <p className="text-sm font-medium">{fileInfo?.name}</p>
                            <p className="text-xs text-muted-foreground">{fileInfo?.size}</p>
                        </div>
                    </div>
                    {!isUploading && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemove();
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}