import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function MainLayout() {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <Header />
                <div className="page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
