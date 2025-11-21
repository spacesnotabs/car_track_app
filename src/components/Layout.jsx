import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../services/firebase';
import { LogOut, Car, User, Menu, X } from 'lucide-react';

const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/activities', label: 'Activities' },
    { to: '/manage-vehicles', label: 'My Vehicles' },
    { to: '/settings', label: 'Settings' }
];

const Layout = ({ children, user }) => {
    const navigate = useNavigate();
    const [isNavOpen, setIsNavOpen] = useState(false);
    const displayName = user?.displayName || 'Signed in';
    const email = user?.email || '';

    const handleLogout = async () => {
        await logout();
        navigate('/login');
        setIsNavOpen(false);
    };

    const closeNav = () => setIsNavOpen(false);

    return (
        <div className="min-h-screen flex flex-col">
            <header className="sticky top-0 z-40 bg-secondary/95 backdrop-blur border-b border-border shadow-[0_4px_30px_rgba(15,23,42,0.35)]">
                <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-4 md:py-6">
                    <Link to="/" className="flex items-center gap-2 text-xl font-semibold text-text-primary">
                        <Car className="text-accent" />
                        <span>CarTrack</span>
                    </Link>

                    {user && (
                        <div className="flex items-center gap-3">
                            <nav className="hidden md:flex items-center gap-3">
                                {navLinks.map(({ to, label }) => (
                                    <Link
                                        key={to}
                                        to={to}
                                        className="px-3 py-2 text-sm font-medium text-text-secondary rounded-lg hover:text-text-primary hover:bg-secondary transition-colors"
                                    >
                                        {label}
                                    </Link>
                                ))}
                                <div className="flex items-center gap-3 pl-3 ml-2 border-l border-border">
                                    {user.photoURL ? (
                                        <img
                                            src={user.photoURL}
                                            alt={user.displayName}
                                            className="w-9 h-9 rounded-full border border-border"
                                        />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-text-secondary">
                                            <User size={18} />
                                        </div>
                                    )}
                                    <button
                                        onClick={handleLogout}
                                        className="text-text-secondary hover:text-text-primary transition-colors"
                                        title="Logout"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            </nav>

                            <div className="flex items-center gap-2 md:hidden">
                                {user.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt={user.displayName}
                                        className="w-9 h-9 rounded-full border border-slate-700"
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-text-secondary">
                                        <User size={18} />
                                    </div>
                                )}
                                <button
                                    onClick={() => setIsNavOpen((open) => !open)}
                                    className="p-2 rounded-lg border border-border text-text-secondary bg-secondary hover:bg-secondary transition-colors"
                                    aria-label="Toggle navigation"
                                    aria-expanded={isNavOpen}
                                >
                                    {isNavOpen ? <X size={18} /> : <Menu size={18} />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {user && (
                    <div
                        className={`md:hidden transition-all duration-200 ease-in-out overflow-hidden ${isNavOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                            }`}
                    >
                        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 pb-4">
                            <div className="rounded-xl border border-border bg-secondary/95 shadow-lg">
                                <div className="flex flex-col gap-1 py-2">
                                    {navLinks.map(({ to, label }) => (
                                        <Link
                                            key={to}
                                            to={to}
                                            onClick={closeNav}
                                            className="px-3 py-2 text-base text-text-secondary hover:text-text-primary hover:bg-secondary transition-colors rounded-lg"
                                        >
                                            {label}
                                        </Link>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between gap-3 px-3 py-3 border-t border-border">
                                    <div className="flex items-center gap-3">
                                        {user.photoURL ? (
                                            <img
                                                src={user.photoURL}
                                                alt={user.displayName}
                                                className="w-10 h-10 rounded-full border border-border"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-text-secondary">
                                                <User size={18} />
                                            </div>
                                        )}
                                        <div className="text-left">
                                            <p className="text-text-primary text-sm leading-tight">{displayName}</p>
                                            {email && <p className="text-xs text-text-secondary truncate max-w-[10rem]">{email}</p>}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-text-primary hover:bg-secondary transition-colors text-sm"
                                    >
                                        <LogOut size={16} />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            <main className="flex-1 container py-6 sm:py-8">
                {children}
            </main>
        </div>
    );
};

export default Layout;
