import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const Layout = () => {
    return (
        <div className="flex min-h-screen bg-[#050A10] text-white">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden">
                <Outlet />
            </main>
        </div>
    );
};
