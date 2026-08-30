import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Eye, EyeOff } from 'lucide-react';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

export default function AdminPage() {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Если уже залогинен — показываем админ-панель
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    const handleLogin = () => {
        if (password === ADMIN_PASSWORD) {
            localStorage.setItem('isAdmin', 'true');
            setError('');
            navigate('/');
        } else {
            setError('Неверный пароль');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isAdmin');
        navigate('/');
    };

    if (isAdmin) {
        return (
            <div className="container mx-auto px-4 py-12 max-w-md">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-emerald-500" />
                            Админ-панель
                        </CardTitle>
                        <CardDescription>Вы вошли как администратор</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Теперь вы можете:
                        </p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                            <li>Редактировать лекции на страницах курсов</li>
                            <li>Добавлять новые лекции через конструктор</li>
                            <li>Изменять порядок модулей и лекций</li>
                        </ul>
                        <Button variant="outline" className="w-full" onClick={handleLogout}>
                            Выйти из админ-панели
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-md">
            <Card>
                <CardHeader className="text-center">
                    <Shield className="mx-auto h-12 w-12 text-primary mb-4" />
                    <CardTitle>Вход для преподавателя</CardTitle>
                    <CardDescription>Введите пароль для доступа к управлению курсами</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Пароль</Label>
                        <div className="relative">
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Введите пароль"
                                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button className="w-full" onClick={handleLogin}>
                        Войти
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}