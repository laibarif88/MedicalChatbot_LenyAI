import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { blogPosts } from '../data/blogData';
import { ClockIcon } from '../components/icons/ClockIcon';
import { ArrowRightIcon } from '../components/icons/ArrowRightIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { Logo } from '../components/icons/Logo';

interface BlogPostPageProps {
    slug: string;
    onNavigateToBlog: () => void;
    onReturnToHome: () => void;
}

const BlogPostPage: React.FC<BlogPostPageProps> = ({ slug, onNavigateToBlog, onReturnToHome }) => {
    const [post, setPost] = useState<(typeof blogPosts)[0] | null>(null);
    
    useEffect(() => {
        window.scrollTo(0, 0);
        const currentPost = blogPosts.find(p => p.slug === slug);
        if (currentPost) {
            setPost(currentPost);
        } else {
            onNavigateToBlog(); // Redirect if post not found
        }
    }, [slug, onNavigateToBlog]);

    if (!post) {
        return null; // or a loading spinner
    }

    const renderContent = (contentItem: any, index: number) => {
        switch (contentItem.type) {
            case 'h2':
                return <h2 key={index} className="text-2xl md:text-3xl font-bold text-stone-800 mt-8 mb-4">{contentItem.text}</h2>;
            case 'p':
                return <p key={index} className="text-lg text-stone-700 mb-6 leading-relaxed">{contentItem.text}</p>;
            case 'ol':
                return <ol key={index} className="list-decimal list-inside space-y-3 pl-4 mb-6 text-lg text-stone-700">{contentItem.items.map((item: string, i: number) => <li key={i}>{item}</li>)}</ol>;
            case 'ul':
                return <ul key={index} className="list-disc list-inside space-y-3 pl-4 mb-6 text-lg text-stone-700">{contentItem.items.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>;
            default:
                return null;
        }
    }

    return (
        <div className="bg-white">
            <Header 
                variant="solid"
                onNavigateToHome={onReturnToHome}
                onNavigateToBlog={onNavigateToBlog}
                onNavigateToWaitingList={() => {}}
                onNavigateToSignUp={() => {}}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="lg:grid lg:grid-cols-3 lg:gap-12">
                    
                    {/* Main Content */}
                    <article className="lg:col-span-2">
                        <header className="mb-8">
                            <p className="text-base font-semibold uppercase text-orange-900 tracking-wider mb-2">{post.category}</p>
                            <h1 className="text-4xl md:text-5xl font-extrabold text-stone-900 leading-tight">{post.title}</h1>
                            <div className="mt-4 flex items-center gap-4 text-sm text-stone-500">
                                <span>{post.date}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1"><ClockIcon className="w-5 h-5" />{post.readTime} min read</span>
                            </div>
                        </header>

                        {/* TLDR Summary Section */}
                        <section className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-lg my-8">
                            <div className="flex items-center gap-3 mb-3">
                                <SparklesIcon className="w-6 h-6 text-amber-600" />
                                <h2 className="text-xl font-bold text-stone-800">TLDR: All you need to know</h2>
                            </div>
                            <p className="text-stone-700 leading-relaxed">{post.aiSummary}</p>
                            <p className="text-xs text-amber-700 mt-4 font-semibold">Powered by Leny AI</p>
                        </section>

                        <div className="prose prose-lg max-w-none">
                           {post.content.map(renderContent)}
                        </div>

                        {/* In-content Newsletter Form */}
                        <div className="bg-stone-100 rounded-lg p-8 my-12 text-center">
                             <h3 className="text-2xl font-bold mb-2">Get Weekly Clinical Updates</h3>
                            <p className="text-stone-600 mb-6">Join 10,000+ providers receiving insights like these every Tuesday.</p>
                            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                                <input type="email" placeholder="Your email address" className="flex-grow py-3 px-4 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-800" />
                                <button type="submit" className="bg-orange-900 hover:bg-orange-800 text-white font-bold py-3 px-6 rounded-lg transition-colors">Subscribe</button>
                            </form>
                        </div>
                    </article>

                    {/* Sticky Sidebar CTA */}
                    <aside className="lg:col-span-1 mt-12 lg:mt-0">
                        <div className="sticky top-24 space-y-8">
                           <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
                                <Logo className="mx-auto" />
                                <h3 className="text-2xl font-bold mt-4 mb-2 text-stone-900">Try Leny Now</h3>
                                <p className="text-stone-600 mb-6">Get trusted medical answers instantly with our AI-powered medical assistant.</p>
                                <button 
                                    onClick={onReturnToHome}
                                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-[#C8824A] hover:bg-orange-800 transition-colors group"
                                >
                                    Sign Up for Free
                                    <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                </button>
                           </div>
                        </div>
                    </aside>
                </div>
            </div>
             <footer className="bg-stone-200">
                <div className="max-w-3xl mx-auto text-center py-16 px-4">
                    <h3 className="text-3xl font-bold mb-3">Get Weekly Clinical Updates</h3>
                    <p className="text-stone-600 mb-8">Join 10,000+ providers receiving evidence-based insights and AI tips every Tuesday.</p>
                    <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                        <input type="email" placeholder="Your email address" className="flex-grow py-3 px-4 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-800" />
                        <button type="submit" className="bg-orange-900 hover:bg-orange-800 text-white font-bold py-3 px-6 rounded-lg transition-colors">Subscribe Free</button>
                    </form>
                </div>
            </footer>
        </div>
    );
};

export default BlogPostPage;
