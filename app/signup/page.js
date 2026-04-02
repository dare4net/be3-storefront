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
                        <div className="text-sm text-gray-500">
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

