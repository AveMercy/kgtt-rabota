import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import Layout from '@/components/Layout';
import Catalog from '@/pages/Catalog';
import CoursePage from '@/pages/CoursePage';
import AdminPage from '@/pages/AdminPage';

function App() {
    return (
        <ThemeProvider>
            <BrowserRouter>
                <Routes>
                    <Route element={<Layout />}>
                        <Route path="/" element={<Catalog />} />
                        <Route path="/course/:courseId" element={<CoursePage />} />
                    </Route>
                    <Route path="/admin" element={<AdminPage />} />
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;