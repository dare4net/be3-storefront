"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthContext";
import { useTenant } from "@/components/providers/TenantContext";
import { useStorefront } from "@/components/providers/StorefrontProvider";
import { Mail, Lock, User, UserPlus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";

export default function SignupPage() {
    const router = useRouter();
    const { register } = useAuth();
    const tenant = useTenant();
    const { theme } = useStorefront();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setLoading(true);

        const result = await register(formData.name, formData.email, formData.password);

        if (result.success) {
            router.push('/account');
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    const handleGoogleLogin = () => {
        if (!tenant || !tenant.id) return;
        const redirectTo = '/account';
        localStorage.setItem("oauth_redirect_to", redirectTo);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
        const returnUrl = window.location.origin;
        window.location.href = `${apiUrl}/auth/google?tenantId=${tenant.id}&returnUrl=${encodeURIComponent(returnUrl)}`;
    };

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[450px] space-y-6">
                <div className="flex flex-col items-center text-center space-y-2">
                    {theme?.variables?.logo ? (
                        <img src={theme.variables.logo} alt={tenant.name} className="h-12 w-auto mb-4 object-contain" />
                    ) : (
                        <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-4">
                            {tenant?.name?.[0] || 'S'}
                        </div>
                    )}
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Create an account</h1>
                    <p className="text-sm text-gray-500">
                        Join us and start your shopping journey today
                    </p>
                </div>

                <Card className="border-none shadow-md">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-xl">Sign up</CardTitle>
                        <CardDescription>
                            Enter your details to create your customer account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-medium">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Full Name</label>
                                <Input
                                    type="text"
                                    name="name"
                                    placeholder="John Doe"
                                    icon={User}
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Email</label>
                                <Input
                                    type="email"
                                    name="email"
                                    placeholder="name@example.com"
                                    icon={Mail}
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Password</label>
                                    <Input
                                        type="password"
                                        name="password"
                                        placeholder="••••••••"
                                        icon={Lock}
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Confirm</label>
                                    <Input
                                        type="password"
                                        name="confirmPassword"
                                        placeholder="••••••••"
                                        icon={Lock}
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" loading={loading}>
                                Create Account
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 text-center">
                        <div className="relative py-2 w-full">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <Button 
                            type="button" 
                            variant="outline" 
                            className="w-full bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                            onClick={handleGoogleLogin}
                        >
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google
                        </Button>

                        <div className="text-sm text-gray-500 mt-2">
                            Already have an account?{" "}
                            <Link href="/login" className="font-medium text-purple-600 hover:underline">
                                Sign in
                            </Link>
                        </div>
                    </CardFooter>
                </Card>

                <p className="px-8 text-center text-xs text-gray-500 leading-relaxed">
                    By creating an account, you agree to our{" "}
                    <Link href="/terms" className="underline underline-offset-4 hover:text-purple-600">
                        Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="underline underline-offset-4 hover:text-purple-600">
                        Privacy Policy
                    </Link>.
                </p>
            </div>
        </div>
    );
}

