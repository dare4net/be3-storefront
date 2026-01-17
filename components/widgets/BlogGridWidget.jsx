// Blog Grid Widget - Latest blog posts
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, User } from 'lucide-react';

export default function BlogGridWidget({ config }) {
    const { title = 'Latest from Our Blog', limit = 3 } = config;
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        // Placeholder - would fetch from blog API
        setPosts([
            {
                id: 1,
                title: 'How to Choose the Perfect Product',
                excerpt: 'Learn the key factors to consider when selecting products...',
                image: '/blog/post1.jpg',
                author: 'John Doe',
                date: '2024-01-15'
            },
            {
                id: 2,
                title: '10 Tips for a Better Shopping Experience',
                excerpt: 'Discover ways to make your online shopping more enjoyable...',
                image: '/blog/post2.jpg',
                author: 'Jane Smith',
                date: '2024-01-10'
            },
            {
                id: 3,
                title: 'New Arrivals This Month',
                excerpt: 'Check out the latest additions to our product lineup...',
                image: '/blog/post3.jpg',
                author: 'Admin',
                date: '2024-01-05'
            }
        ]);
    }, []);

    return (
        <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
                {title && (
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{title}</h2>
                )}

                <div className="grid md:grid-cols-3 gap-8">
                    {posts.slice(0, limit).map((post) => (
                        <Link key={post.id} href={`/blog/${post.slug || post.id}`} className="group">
                            <article className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition">
                                <div className="relative aspect-video bg-gray-200 overflow-hidden">
                                    {post.image && (
                                        <img
                                            src={post.image}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                    )}
                                </div>
                                <div className="p-6">
                                    <h3 className="font-bold text-xl mb-3 group-hover:text-blue-600 transition">
                                        {post.title}
                                    </h3>
                                    <p className="text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <User className="w-4 h-4" />
                                            {post.author}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(post.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
