"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthContext";
import { useTenant } from "@/components/providers/TenantContext";
import { useStorefront } from "@/components/providers/StorefrontProvider";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ShoppingBag, Star, Shield, Truck } from "lucide-react";

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const PERKS = [
    { icon: ShoppingBag, text: "Shop thousands of products" },
    { icon: Truck,       text: "Fast & reliable delivery"   },
    { icon: Shield,      text: "Secure & protected payments"},
    { icon: Star,        text: "Exclusive member deals"     },
];

function PasswordStrength({ password }) {
    if (!password) return null;
    const checks = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[^A-Za-z0-9]/.test(password),
    ];
    const score = checks.filter(Boolean).length;
    const label = ['', 'Weak', 'Fair', 'Good', 'Strong'][score];
    const colors = ['', 'bg-red-400', 'bg-amber-400', 'bg-yellow-400', 'bg-green-500'];
    return (
        <div className="mt-2 space-y-1.5">
            <div className="flex gap-1">
                {[1,2,3,4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= score ? colors[score] : 'bg-gray-200'}`} />
                ))}
            </div>
            {score > 0 && <p className={`text-[11px] font-semibold ${['','text-red-500','text-amber-500','text-yellow-600','text-green-600'][score]}`}>{label} password</p>}
        </div>
    );
}

export default function SignupPage() {
    const router = useRouter();
    const { register } = useAuth();
    const tenant = useTenant();
    const { theme } = useStorefront();

    const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
    const [showPw, setShowPw]         = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState("");

    const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (formData.password !== formData.confirmPassword) return setError("Passwords do not match");
        if (formData.password.length < 8) return setError("Password must be at least 8 characters");
        setLoading(true);
        const result = await register(formData.name, formData.email, formData.password);
        if (result.success) {
            router.push("/account");
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    const handleGoogleLogin = () => {
        if (!tenant?.id) return;
        localStorage.setItem("oauth_redirect_to", "/account");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
        window.location.href = `${apiUrl}/auth/google?tenantId=${tenant.id}&returnUrl=${encodeURIComponent(window.location.origin)}`;
    };

    return (
        <div className="min-h-screen flex">

            {/* ── Left panel ── */}
            <div className="hidden lg:flex lg:w-[44%] relative overflow-hidden flex-col justify-between p-12" style={{ background: '#1a56e8' }}>
                <div className="absolute inset-0 opacity-[0.10]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
                <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10" />
                <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/10" />

                {/* Logo */}
                <div className="relative z-10">
                    {theme?.variables?.logo ? (
                        <img src={theme.variables.logo} alt={tenant?.name} className="h-10 w-auto object-contain brightness-0 invert" />
                    ) : (
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white font-black text-lg">
                                {tenant?.name?.[0] || 'B'}
                            </div>
                            <span className="text-white font-bold text-lg">{tenant?.name || 'BE3'}</span>
                        </div>
                    )}
                </div>

                {/* Hero copy */}
                <div className="relative z-10 space-y-8">
                    <div>
                        <h2 className="text-4xl font-black text-white leading-tight mb-3 flex items-center gap-3">
                            Join the community
                            <img src="/carts.svg" alt="" className="h-10 w-auto inline-block" />
                        </h2>
                        <p className="text-blue-100/80 text-base leading-relaxed max-w-xs">
                            Create your account and unlock a world of products, deals, and seamless shopping.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {PERKS.map(({ icon: Icon, text }) => (
                            <div key={text} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                                    <Icon className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm text-blue-100 font-medium">{text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="relative z-10 text-blue-200/60 text-xs">
                    © {new Date().getFullYear()} {tenant?.name || 'BE3'}. All rights reserved.
                </p>
            </div>

            {/* ── Right panel (form) ── */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white overflow-y-auto">
                <div className="w-full max-w-[420px] space-y-6">

                    {/* Mobile logo */}
                    <div className="lg:hidden flex justify-center">
                        {theme?.variables?.logo ? (
                            <img src={theme.variables.logo} alt={tenant?.name} className="h-10 w-auto object-contain" />
                        ) : (
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg" style={{ background: '#1a56e8' }}>
                                {tenant?.name?.[0] || 'B'}
                            </div>
                        )}
                    </div>

                    {/* Heading */}
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">Create account</h1>
                        <p className="text-sm text-gray-400 mt-1">Join us and start your shopping journey</p>
                    </div>

                    {/* Google */}
                    <button onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                        <GoogleIcon />
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-xs text-gray-400 font-medium">or register with email</span>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Full name */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input type="text" name="name" required placeholder="John Doe"
                                    value={formData.name} onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input type="email" name="email" required placeholder="name@example.com"
                                    value={formData.email} onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
                            </div>
                        </div>

                        {/* Password row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <input type={showPw ? "text" : "password"} name="password" required placeholder="••••••••"
                                        value={formData.password} onChange={handleChange}
                                        className="w-full pl-10 pr-9 py-3 border border-gray-200 rounded-2xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
                                    <button type="button" onClick={() => setShowPw(p => !p)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                        {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                                <PasswordStrength password={formData.password} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Confirm</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <input type={showConfirm ? "text" : "password"} name="confirmPassword" required placeholder="••••••••"
                                        value={formData.confirmPassword} onChange={handleChange}
                                        className="w-full pl-10 pr-9 py-3 border border-gray-200 rounded-2xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
                                    <button type="button" onClick={() => setShowConfirm(p => !p)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                        {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                                {/* Match indicator */}
                                {formData.confirmPassword && (
                                    <p className={`text-[11px] font-semibold mt-1.5 ${formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                                        {formData.password === formData.confirmPassword ? '✓ Passwords match' : '✗ Does not match'}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Submit */}
                        <button type="submit" disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-60 mt-2"
                            style={{ background: '#1a56e8' }}>
                            {loading ? (
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                            ) : <>Create Account <ArrowRight className="w-4 h-4" /></>}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-sm text-gray-500">
                        Already have an account?{" "}
                        <Link href="/login" className="font-bold text-blue-600 hover:underline">Sign in</Link>
                    </p>

                    <p className="text-center text-xs text-gray-400 leading-relaxed">
                        By creating an account, you agree to our{" "}
                        <Link href="/terms" className="underline hover:text-blue-600">Terms</Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="underline hover:text-blue-600">Privacy Policy</Link>.
                    </p>
                </div>
            </div>
        </div>
    );
}
