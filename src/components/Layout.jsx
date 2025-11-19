import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../services/firebase';
import { LogOut, Car, User } from 'lucide-react';

const Layout = ({ children, user }) => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-slate-900 border-b border-slate-800 p-4">
                <div className="container flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white">
                        <Car className="text-blue-500" />
                        <span>CarTrack</span>
                    </Link>

                    <nav className="flex items-center gap-4">
                        {user && (
                            <>
                                <Link to="/" className="text-slate-300 hover:text-white">Dashboard</Link>
                                <Link to="/manage-vehicles" className="text-slate-300 hover:text-white">My Vehicles</Link>
                                <div className="flex items-center gap-2 ml-4">
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full border border-slate-700" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                                            <User size={16} />
                                        </div>
                                    )}
                                    <button onClick={handleLogout} className="text-slate-400 hover:text-white" title="Logout">
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            <main className="flex-1 container py-8">
                {children}
            </main>
        </div>
    );
};

export default Layout;
