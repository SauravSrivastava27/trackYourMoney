
"use client";

import {
    useEffect,
    useRef,
    useState,
} from "react";
import type { ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import { refreshAuthSession } from "../lib/api";
import {
    usePathname,
    useRouter,
} from "next/navigation";
import {
    Sun,
    Moon,
    ChevronDown,
    Menu,
    X,
    LayoutDashboard,
    Settings,
    LogOut,
    Wallet,
    ArrowLeftRight,
    Tags,
    PiggyBank,
    ChartNoAxesCombined,
    Target,
    Sparkles,
    Palette,
    Check,
    LoaderCircle,
} from "lucide-react";

type User = {
    id?: string;
    name?: string;
    fullName?: string;
    email: string;
    image?: string | null;
    profileImage?: string | null;
};

type NavItem = {
    label: string;
    href?: string;
    icon: ComponentType<{ className?: string }>;
    implemented?: boolean;
};

type NavGroup = {
    label: string;
    items: NavItem[];
};

const navGroups: NavGroup[] = [
    {
        label: "Money Management",
        items: [
            {
                label: "Accounts",
                href: "/accounts",
                icon: Wallet,
                implemented: true,
            },
            { label: "Transactions", href: "/transactions", icon: ArrowLeftRight, implemented: true },
            { label: "Categories", href: "/categories", icon: Tags, implemented: true },
            { label: "Budgets", icon: PiggyBank },
        ],
    },
    {
        label: "Insights",
        items: [
            {
                label: "Reports & Analytics",
                href: "/reports",
                icon: ChartNoAxesCombined,
                implemented: true,
            },
            { label: "AI Insights", href: "/insights", icon: Sparkles, implemented: true },
        ],
    },
    {
        label: "Planning",
        items: [
            { label: "Savings Goals", icon: Target },
        ],
    },
];

function getName(user: User | null) {
    return user?.name || user?.fullName || "My Account";
}

function getInitials(user: User | null) {
    const name = user?.name || user?.fullName;

    if (name?.trim()) {
        return name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase();
    }

    return user?.email?.[0]?.toUpperCase() || "U";
}

function Avatar({ user }: { user: User | null }) {
    const [imageFailed, setImageFailed] = useState(false);
    const imageUrl = user?.image || user?.profileImage;

    return (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {imageUrl && !imageFailed ? (
                <Image
                    src={imageUrl}
                    alt=""
                    width={32}
                    height={32}
                    unoptimized
                    onError={() => setImageFailed(true)}
                    className="h-full w-full object-cover"
                />
            ) : (
                getInitials(user)
            )}
        </span>
    );
}

function MenuGroup({
    group,
    onNavigate,
}: {
    group: NavGroup;
    onNavigate: () => void;
}) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function closeOutside(event: MouseEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        }

        function closeEscape(event: KeyboardEvent) {
            if (event.key === "Escape") setOpen(false);
        }

        document.addEventListener("mousedown", closeOutside);
        document.addEventListener("keydown", closeEscape);

        return () => {
            document.removeEventListener("mousedown", closeOutside);
            document.removeEventListener("keydown", closeEscape);
        };
    }, []);

    return (
        <div ref={menuRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-muted"
            >
                {group.label}
                <ChevronDown
                    className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""
                        }`}
                />
            </button>

            {open && (
                <div className="absolute left-0 top-full z-50 mt-2 w-60 rounded-xl border border-border bg-card p-2 text-card-foreground shadow-xl">
                    {group.items.map((item) => {
                        const Icon = item.icon;

                        if (!item.implemented || !item.href) {
                            return (
                                <div
                                    key={item.label}
                                    aria-disabled="true"
                                    title="Coming soon"
                                    className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground/60"
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="flex-1">{item.label}</span>
                                    <span className="text-[10px]">Soon</span>
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                onClick={() => {
                                    setOpen(false);
                                    onNavigate();
                                }}
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted"
                            >
                                <Icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const profileRef = useRef<HTMLDivElement>(null);

    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [profileOpen, setProfileOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const apiUrl = (
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5000"
    ).replace(/\/$/, "");

    useEffect(() => {
        const saved = localStorage.getItem("theme");
        const dark =
            saved === "dark" ||
            (!saved &&
                window.matchMedia("(prefers-color-scheme: dark)").matches);

        document.documentElement.classList.toggle("dark", dark);

        if (!saved) {
            localStorage.setItem("theme", dark ? "dark" : "light");
        }

        setIsDark(dark);
    }, []);

    // Check the session on every page, including /auth.
    useEffect(() => {
        let cancelled = false;

        async function loadUser() {
            setAuthLoading(true);

            try {
                let response = await fetch(
                    `${apiUrl}/api/v1/auth/me`,
                    {
                        credentials: "include",
                        cache: "no-store",
                    }
                );

                if (response.status === 401) {
                    const refreshed = await refreshAuthSession();
                    if (refreshed) {
                        response = await fetch(
                            `${apiUrl}/api/v1/auth/me`,
                            { credentials: "include", cache: "no-store" }
                        );
                    }
                }

                if (!response.ok) {
                    if (!cancelled) setUser(null);
                    return;
                }

                const data = await response.json();

                if (!cancelled) {
                    setUser(data.user ?? data);
                }
            } catch {
                if (!cancelled) setUser(null);
            } finally {
                if (!cancelled) setAuthLoading(false);
            }
        }

        void loadUser();

        return () => {
            cancelled = true;
        };
    }, [apiUrl, pathname]);

    useEffect(() => {
        function closeOutside(event: MouseEvent) {
            if (
                profileRef.current &&
                !profileRef.current.contains(event.target as Node)
            ) {
                setProfileOpen(false);
            }
        }

        function closeEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setProfileOpen(false);
                setMobileOpen(false);
            }
        }

        document.addEventListener("mousedown", closeOutside);
        document.addEventListener("keydown", closeEscape);

        return () => {
            document.removeEventListener("mousedown", closeOutside);
            document.removeEventListener("keydown", closeEscape);
        };
    }, []);

    function toggleTheme() {
        const next = !isDark;

        document.documentElement.classList.toggle("dark", next);
        localStorage.setItem("theme", next ? "dark" : "light");
        setIsDark(next);
    }

    async function handleSignOut() {
        if (loggingOut) return;

        setLoggingOut(true);

        try {
            const response = await fetch(
                `${apiUrl}/api/v1/auth/logout`,
                {
                    method: "POST",
                    credentials: "include",
                }
            );

            if (!response.ok) {
                throw new Error("Sign out failed");
            }

            setUser(null);
            setProfileOpen(false);
            setMobileOpen(false);
            router.replace("/");
            router.refresh();
        } catch {
            window.alert("Unable to sign out. Please try again.");
        } finally {
            setLoggingOut(false);
        }
    }

    return (
        <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background text-foreground shadow-sm">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
                <Link
                    href="/"
                    aria-label="FinTrack AI home"
                    className="flex shrink-0 items-center"
                >
                    <Image
                        src="/logo.svg"
                        alt=""
                        width={36}
                        height={36}
                        priority
                        className="h-9 w-9"
                    />
                    <span className="ml-2 text-lg font-bold tracking-tight text-foreground">
                        FinTrack <span className="text-primary">AI</span>
                    </span>
                </Link>

                {authLoading ? (
                    <div
                        className="h-9 w-20 animate-pulse rounded-lg bg-muted"
                        aria-label="Checking login"
                    />
                ) : user ? (
                    <>
                        <nav
                            aria-label="Main navigation"
                            className="hidden flex-1 items-center justify-center gap-1 lg:flex"
                        >
                            <Link
                                href="/dashboard"
                                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${pathname === "/dashboard"
                                    ? "bg-primary/10 text-primary"
                                    : "hover:bg-muted"
                                    }`}
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                Dashboard
                            </Link>

                            {navGroups.map((group) => (
                                <MenuGroup
                                    key={group.label}
                                    group={group}
                                    onNavigate={() => setProfileOpen(false)}
                                />
                            ))}
                        </nav>

                        <div className="flex shrink-0 items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setMobileOpen((value) => !value)}
                                aria-label="Toggle navigation"
                                aria-expanded={mobileOpen}
                                className="rounded-lg p-2 hover:bg-muted lg:hidden"
                            >
                                {mobileOpen ? (
                                    <X className="h-5 w-5" />
                                ) : (
                                    <Menu className="h-5 w-5" />
                                )}
                            </button>

                            <div ref={profileRef} className="relative">
                                <button
                                    type="button"
                                    onClick={() => setProfileOpen((value) => !value)}
                                    aria-label="Open profile menu"
                                    aria-expanded={profileOpen}
                                    aria-haspopup="true"
                                    title={getName(user)}
                                    className="flex items-center gap-2 rounded-xl border border-border bg-card p-2 transition hover:bg-muted"
                                >
                                    <Avatar user={user} />
                                    <ChevronDown
                                        className={`h-4 w-4 transition-transform ${profileOpen ? "rotate-180" : ""
                                            }`}
                                    />
                                </button>

                                {profileOpen && (
                                    <div className="absolute right-0 top-full z-50 mt-3 w-[280px] max-w-[calc(100vw-24px)] rounded-2xl border border-border bg-card p-2 text-card-foreground shadow-xl">
                                        <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <Palette className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm font-medium">Appearance</span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={toggleTheme}
                                                className="flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium"
                                            >
                                                {isDark ? (
                                                    <Moon className="h-3.5 w-3.5" />
                                                ) : (
                                                    <Sun className="h-3.5 w-3.5" />
                                                )}
                                                {isDark ? "Dark" : "Light"}
                                            </button>
                                        </div>

                                        <div className="my-2 border-t border-border" />

                                        <div
                                            aria-disabled="true"
                                            title="Coming soon"
                                            className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground/60"
                                        >
                                            <Settings className="h-4 w-4" />
                                            <span className="flex-1">Settings</span>
                                            <span className="text-[10px]">Soon</span>
                                        </div>

                                        <div className="my-2 border-t border-border" />

                                        <div className="flex items-center gap-3 px-3 py-3">
                                            <Avatar user={user} />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold">
                                                    {getName(user)}
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="border-t border-border" />

                                        <button
                                            type="button"
                                            onClick={handleSignOut}
                                            disabled={loggingOut}
                                            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-500/10 disabled:opacity-60"
                                        >
                                            {loggingOut ? (
                                                <LoaderCircle className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <LogOut className="h-4 w-4" />
                                            )}
                                            {loggingOut ? "Signing out..." : "Sign Out"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {mobileOpen && (
                            <div className="absolute left-0 right-0 top-14 border-b border-border bg-background px-4 py-3 shadow-lg lg:hidden">
                                <nav aria-label="Mobile navigation" className="space-y-2">
                                    <Link
                                        href="/dashboard"
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
                                    >
                                        <LayoutDashboard className="h-4 w-4" />
                                        Dashboard
                                        {pathname === "/dashboard" && (
                                            <Check className="ml-auto h-4 w-4" />
                                        )}
                                    </Link>

                                    {navGroups.map((group) => (
                                        <details key={group.label} className="group rounded-lg">
                                            <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">
                                                {group.label}
                                                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                                            </summary>

                                            <div className="ml-3 mt-1 space-y-1 border-l border-border pl-3">
                                                {group.items.map((item) => {
                                                    const Icon = item.icon;

                                                    if (!item.implemented || !item.href) {
                                                        return (
                                                            <div
                                                                key={item.label}
                                                                aria-disabled="true"
                                                                title="Coming soon"
                                                                className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground/60"
                                                            >
                                                                <Icon className="h-4 w-4" />
                                                                <span className="flex-1">{item.label}</span>
                                                                <span className="text-[10px]">Soon</span>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <Link
                                                            key={item.label}
                                                            href={item.href}
                                                            onClick={() => setMobileOpen(false)}
                                                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted ${pathname === item.href
                                                                    ? "bg-primary/10 text-primary"
                                                                    : ""
                                                                }`}
                                                        >
                                                            <Icon className="h-4 w-4" />
                                                            <span className="flex-1">{item.label}</span>

                                                            {pathname === item.href && (
                                                                <Check className="ml-auto h-4 w-4" />
                                                            )}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </details>
                                    ))}
                                </nav>
                            </div>
                        )}
                    </>
                ) : (
                    <Link
                        href="/auth"
                        className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                    >
                        Login
                    </Link>
                )}
            </div>
        </header>
    );
}
