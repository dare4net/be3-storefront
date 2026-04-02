"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthContext";
import { useTenant } from "@/components/providers/TenantContext";
import { useStorefront } from "@/components/providers/StorefrontProvider";
import { Mail, Lock, LogIn, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();
    const tenant = useTenant();
    const { theme } = useStorefront();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const result = await login(formData.email, formData.password);

        if (result.success) {
            const redirectTo = searchParams.get('redirect') || '/';
            router.push(redirectTo);
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[400px] space-y-6">
                <div className="flex flex-col items-center text-center space-y-2">
                    {theme?.variables?.logo ? (
                        <img src={theme.variables.logo} alt={tenant.name} className="h-12 w-auto mb-4 object-contain" />
                    ) : (
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-4">
                            {tenant?.name?.[0] || 'S'}
                        </div>
                    )}
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Welcome back</h1>
                    <p className="text-sm text-gray-500">
                        Enter your credentials to access your account
                    </p>
                </div>

                <Card className="border-none shadow-md">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-xl">Sign in</CardTitle>
                        <CardDescription>
                            Sign in to manage your orders and profile
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
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-gray-700">Password</label>
                                    <Link href="#" className="text-xs text-blue-600 hover:underline">
                                        Forgot password?
                                    </Link>
                                </div>
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
                            <Button type="submit" className="w-full" loading={loading}>
                                Sign In
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <div className="relative py-2 w-full">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-gray-500">Or continue with</span>
                            </div>
                        </div>
                        <div className="text-center text-sm text-gray-500">
                            Don&apos;t have an account?{" "}
                            <Link href="/signup" className="font-medium text-blue-600 hover:underline">
                                Create an account
                            </Link>
                        </div>
                    </CardFooter>
                </Card>

                <p className="px-8 text-center text-xs text-gray-500 leading-relaxed">
                    By clicking continue, you agree to our{" "}
                    <Link href="/terms" className="underline underline-offset-4 hover:text-blue-600">
                        Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="underline underline-offset-4 hover:text-blue-600">
                        Privacy Policy
                    </Link>.
                </p>
            </div>
        </div>
    );
}

