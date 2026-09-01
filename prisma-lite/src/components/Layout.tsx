// src/components/Layout.tsx

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
                <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-3 md:px-4">
                    <Link to="/" className="flex items-center gap-2 text-lg md:text-xl font-bold text-primary min-w-0">
                        <GraduationCap className="h-6 w-6 md:h-7 md:w-7 flex-shrink-0" />
                        <span className="truncate">КГТТ</span>
                    </Link>
                    <nav className="flex items-center gap-2 md:gap-4">
                        <Link
                            to="/"
                            className={`text-sm ${location.pathname === '/' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Курсы
                        </Link>
                        <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
                            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                        </Button>
                    </nav>
                </div>

            </header>
            <main>
                <Outlet />
            </main>
        </div>
    );
}