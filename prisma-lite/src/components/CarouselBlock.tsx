import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import ImageViewer from './ImageViewer';


interface Props {
    images: { src: string; alt: string }[];
}

export default function CarouselBlock({ images }: Props) {
    const [current, setCurrent] = useState(0);

    if (!images || images.length === 0) return null;

    const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
    const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));
    const [viewerImage, setViewerImage] = useState<string | null>(null);

    return (
        <div className="relative my-6 rounded-xl overflow-hidden bg-muted">
            <img
                src={images[current].src}
                alt={images[current].alt}
                className="w-full max-h-[500px] object-contain mx-auto cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setViewerImage(images[current].src)}
            />
            {images[current].alt && (
                <p className="text-center text-sm text-muted-foreground py-2">{images[current].alt}</p>
            )}
            {images.length > 1 && (
                <>
                    <button onClick={prev}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70">
                        <ChevronLeft className="h-5 w-5"/>
                    </button>
                    <button onClick={next}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70">
                        <ChevronRight className="h-5 w-5"/>
                    </button>
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrent(i)}
                                className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? 'bg-white scale-110' : 'bg-white/50'}`}
                            />
                        ))}
                    </div>
                </>
            )}
            {viewerImage && (
                <ImageViewer
                    src={viewerImage}
                    alt={images[current]?.alt}
                    onClose={() => setViewerImage(null)}
                />
            )}
        </div>
    );
}