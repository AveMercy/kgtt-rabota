import { useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
    src: string;
    alt?: string;
    onClose: () => void;
}

export default function ImageViewer({ src, alt, onClose }: Props) {
    // Закрытие по Escape
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
                <X className="h-6 w-6" />
            </button>
            <img
                src={src}
                alt={alt || ''}
                className="max-w-full max-h-[90vh] object-contain rounded-xl"
                onClick={(e) => e.stopPropagation()}
            />
            {alt && (
                <p className="absolute bottom-6 text-white text-sm bg-black/50 px-3 py-1 rounded-full">{alt}</p>
            )}
        </div>
    );
}