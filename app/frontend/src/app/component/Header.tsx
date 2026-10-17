"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Home, User, Mail, Sun, Moon } from 'lucide-react';

const navLinks = [
    { name: "Home", href: "/", icon: <Home className="w-4 h-4" /> },
    { name: "About", href: "/about", icon: <User className="w-4 h-4" /> },
    { name: "Contact", href: "/contact", icon: <Mail className="w-4 h-4" /> },
];

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);
    
    const [theme, setTheme] = useState(() => {
        if (typeof window !== "undefined") {
            const savedTheme = localStorage.getItem('theme');
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            return savedTheme === 'dark' || (!savedTheme && systemPrefersDark) ? 'dark' : 'light';
        }
        return 'light';
    });

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        const nextTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(nextTheme);
        localStorage.setItem('theme', nextTheme);
    };

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    return (
        <header className="fixed top-0 left-0 w-full z-50 bg-black text-white border-b border-zinc-800 shadow-sm transition-colors duration-200">
            <nav className="max-w-7xl mx-auto px-6 h-[56px] flex items-center justify-between">
                
                <Link 
                    href="/" 
                    onClick={closeMenu} 
                    className="font-black text-xl tracking-wider hover:text-gray-300 transition-colors uppercase flex items-center"
                >
                    <Image src="/logo.svg" width={40} height={40} alt="Logo" className="inline-block mr-2" />
                </Link>

                <div className="hidden md:flex items-center gap-8 font-medium">
                    {navLinks.map((link) => (
                        <Link 
                            key={link.href} 
                            href={link.href} 
                            className="hover:text-gray-300 transition-colors text-sm flex items-center gap-2 "
                        >
                            {link.icon}
                            <span>{link.name}</span>
                        </Link>
                    ))}

                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-md hover:bg-zinc-900 transition-colors cursor-pointer"
                        aria-label="Toggle theme color mode"
                    >
                        {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-zinc-400" />}
                    </button>
                </div>

                <div className="flex items-center gap-2 md:hidden">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-md hover:bg-zinc-900 transition-colors cursor-pointer"
                        aria-label="Toggle theme color mode"
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-zinc-400" />}
                    </button>

                    <button 
                        onClick={toggleMenu}
                        type="button"
                        className="p-2 rounded-md hover:bg-zinc-900 focus:outline-none transition-colors"
                        aria-label="Toggle navigation"
                    >
                        <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                            {isOpen ? (
                                <path fillRule="evenodd" clipRule="evenodd" d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.828 4.828 4.829z" />
                            ) : (
                                <path fillRule="evenodd" d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z" />
                            )}
                        </svg>
                    </button>
                </div>
            </nav>

            {isOpen && (
                <div className="md:hidden absolute top-[56px] left-0 w-full bg-black border-b border-zinc-800 flex flex-col px-6 py-4 gap-4 shadow-xl">
                    {navLinks.map((link) => (
                        <Link 
                            key={link.href} 
                            href={link.href} 
                            onClick={closeMenu} 
                            className="flex items-center gap-2 py-2 text-base font-medium border-b border-zinc-900 last:border-0 hover:text-gray-300 transition-colors"
                        >
                            {link.icon}
                            <span>{link.name}</span>
                        </Link>
                    ))}
                </div>
            )}
        </header>
    );
}
