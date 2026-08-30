import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';
import { Sun, Moon, GraduationCap } from 'lucide-react';

export default function Layout() {
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary">
                        <GraduationCap className="h-7 w-7" />
                        <span>Prisma Lite</span>
                    </Link>
                    <nav className="flex items-center gap-4">
                        <Link
                            to="/"
                            className={`text-sm ${location.pathname === '/' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Курсы
                        </Link>
                        <Button variant="ghost" size="icon" onClick={toggleTheme}>
                            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                        </Button>
                    </nav>
                </div>
                <Link to="/admin" className="text-xs text-muted-foreground/30 hover:text-muted-foreground/50">
                    ·
                </Link>
            </header>
            <main>
                <Outlet />
            </main>
        </div>
    );
}