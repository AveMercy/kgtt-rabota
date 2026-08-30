// src/services/googleDrive.ts

const CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
const FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;

export interface GoogleDriveFile {
    id: string;
    name: string;
    webContentLink?: string;
    webViewLink?: string;
    mimeType: string;
    size?: string;
}

class GoogleDriveService {
    private folderId: string;
    private accessToken: string | null = null;
    private cache: Map<string, { data: any; timestamp: number }> = new Map();
    private readonly CACHE_TTL = 5 * 60 * 1000;
    private tokenExpiry: number = 0;

    constructor() {
        this.folderId = FOLDER_ID || '';
        this.accessToken = localStorage.getItem('google_drive_token');
        this.tokenExpiry = parseInt(localStorage.getItem('google_drive_token_expiry') || '0');
    }

    // Проверка авторизации
    private async ensureAuthorized(): Promise<void> {
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return;
        }

        // Проверяем, загружен ли Google API
        if (typeof (window as any).google === 'undefined') {
            await this.loadGoogleAPI();
        }

        return new Promise((resolve, reject) => {
            try {
                const client = (window as any).google?.accounts?.oauth2?.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: 'https://www.googleapis.com/auth/drive.file',
                    callback: (response: any) => {
                        if (response.error) {
                            console.error('OAuth Error:', response);
                            reject(new Error(response.error));
                            return;
                        }

                        this.accessToken = response.access_token;
                        this.tokenExpiry = Date.now() + (response.expires_in * 1000);

                        localStorage.setItem('google_drive_token', response.access_token);
                        localStorage.setItem('google_drive_token_expiry', String(this.tokenExpiry));

                        console.log('✅ OAuth авторизация успешна');
                        resolve();
                    },
                    error_callback: (error: any) => {
                        console.error('OAuth Error Callback:', error);
                        reject(new Error(error?.message || 'Ошибка авторизации'));
                    }
                });

                client.requestAccessToken();
            } catch (error) {
                console.error('Ошибка инициализации OAuth:', error);
                reject(error);
            }
        });
    }

    // Загрузка Google API если не загружен
    private loadGoogleAPI(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (typeof (window as any).google !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Не удалось загрузить Google API'));
            document.head.appendChild(script);
        });
    }

    // Загрузка файла
    async uploadFile(file: File): Promise<GoogleDriveFile> {
        await this.ensureAuthorized();

        try {
            console.log(`📤 Загрузка файла: ${file.name} (${this.formatSize(file.size)})`);

            const metadata = {
                name: file.name,
                parents: [this.folderId],
            };

            const formData = new FormData();
            formData.append(
                'metadata',
                new Blob([JSON.stringify(metadata)], { type: 'application/json' })
            );
            formData.append('file', file);

            const response = await fetch(
                'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                    },
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Ошибка загрузки:', errorText);

                // Если токен истек, пробуем обновить
                if (response.status === 401) {
                    this.accessToken = null;
                    localStorage.removeItem('google_drive_token');
                    return this.uploadFile(file);
                }

                throw new Error(`Ошибка загрузки: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log(`✅ Файл загружен! ID: ${data.id}`);

            this.cache.clear();

            return await this.getFileInfo(data.id);
        } catch (error) {
            console.error('❌ Критическая ошибка загрузки:', error);
            throw error;
        }
    }

    // Получение информации о файле
    async getFileInfo(fileId: string): Promise<GoogleDriveFile> {
        const cached = this.cache.get(`file_${fileId}`);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            console.log(`📦 Используем кэш для файла ${fileId}`);
            return cached.data;
        }

        await this.ensureAuthorized();

        try {
            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,webContentLink,webViewLink,mimeType,size`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Не удалось получить информацию о файле: ${response.status}`);
            }

            const data = await response.json();

            this.cache.set(`file_${fileId}`, {
                data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            console.error('❌ Ошибка получения информации:', error);
            throw error;
        }
    }

    // Получение списка файлов
    async listFiles(): Promise<GoogleDriveFile[]> {
        const cacheKey = 'files_list';
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            console.log(`📦 Используем кэш списка файлов (${cached.data.length} файлов)`);
            return cached.data;
        }

        await this.ensureAuthorized();

        try {
            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files?q='${this.folderId}'+in+parents&fields=files(id,name,webContentLink,webViewLink,mimeType,size)`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Не удалось получить список файлов: ${response.status}`);
            }

            const data = await response.json();
            const files = data.files || [];

            this.cache.set(cacheKey, {
                data: files,
                timestamp: Date.now()
            });

            console.log(`📁 Найдено ${files.length} файлов в папке`);
            return files;
        } catch (error) {
            console.error('❌ Ошибка получения списка файлов:', error);
            throw error;
        }
    }

    // Удаление файла
    async deleteFile(fileId: string): Promise<void> {
        await this.ensureAuthorized();

        try {
            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Не удалось удалить файл: ${response.status}`);
            }

            this.cache.clear();
            console.log(`🗑️ Файл ${fileId} удален`);
        } catch (error) {
            console.error('❌ Ошибка удаления файла:', error);
            throw error;
        }
    }

    // Получение URL для отображения изображения
    getImageUrl(fileId: string): string {
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }

    // Получение URL для скачивания файла
    getDownloadUrl(fileId: string): string {
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }

    // Получение URL с оптимизацией
    getOptimizedImageUrl(fileId: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
        const baseUrl = this.getImageUrl(fileId);

        const sizes = {
            small: 'w=200&h=200',
            medium: 'w=600&h=600',
            large: 'w=1200&h=1200'
        };

        return `${baseUrl}&${sizes[size]}`;
    }

    // Проверка, является ли файл изображением
    isImage(mimeType: string): boolean {
        return mimeType.startsWith('image/');
    }

    private formatSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }

    clearCache(): void {
        this.cache.clear();
        console.log('🧹 Кэш очищен');
    }
}

export const googleDrive = new GoogleDriveService();