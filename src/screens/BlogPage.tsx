import React from 'react';
import Header from '../components/Header';
import { ClockIcon } from '../components/icons/ClockIcon';
import { ArrowRightIcon } from '../components/icons/ArrowRightIcon';
import { blogPosts } from '../data/blogData';

interface BlogPageProps {
    onNavigateToBlogPost: (slug: string) => void;
    onReturnToHome: () => void;
}

const featuredPost = blogPosts.find(p => p.featured);
const regularPosts = blogPosts.filter(p => !p.featured);


const BlogCard = ({ post, onNavigateToBlogPost }: { 
    post: typeof blogPosts[0]; 
    onNavigateToBlogPost: (slug: string) => void;
}) => (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col">
        <div className="h-48 bg-amber-50 flex items-center justify-center text-5xl relative">
            {post.icon}
            {post.isNew && (
                <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    New
                </div>
            )}
        </div>
        <div className="p-6 flex-grow flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-sm text-stone-500">
                <span className="font-semibold uppercase text-orange-900 tracking-wider">{post.category}</span>
                <span>•</span>
                <span>{post.date}</span>
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-3 leading-snug">{post.title}</h3>
            <p className="text-stone-600 flex-grow mb-4">{post.excerpt}</p>
            <div className="pt-4 border-t border-stone-200 flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-stone-500">
                    <ClockIcon className="w-5 h-5" /> {post.readTime} min read
                </span>
                <button 
                    onClick={() => onNavigateToBlogPost(post.slug)}
                    className="text-orange-900 font-bold flex items-center gap-1 group hover:underline"
                >
                    Read More <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
            </div>
        </div>
    </div>
);


const BlogPage: React.FC<BlogPageProps> = ({ onNavigateToBlogPost, onReturnToHome }) => {
    const categories = ['All Topics', 'Differential Diagnosis', 'Documentation', 'Clinical Guidelines', 'Billing', 'AI Tools', 'Efficiency Tips', 'Case Studies', 'Practice Management', 'AI Integration'];
    const [activeCategory, setActiveCategory] = React.useState('All Topics');
    const [searchTerm, setSearchTerm] = React.useState('');

    const filteredPosts = React.useMemo(() => {
        let posts = activeCategory === 'All Topics' 
            ? regularPosts 
            : regularPosts.filter(post => post.category === activeCategory);
        
        if (searchTerm.trim()) {
            posts = posts.filter(post => 
                post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.category.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        return posts;
    }, [activeCategory, searchTerm]);

    return (
        <div className="bg-stone-50 text-stone-800">
            <Header 
                variant="solid"
                onNavigateToHome={onReturnToHome}
                onNavigateToBlog={() => {}}
                onNavigateToWaitingList={() => {}}
                onNavigateToSignUp={() => {}}
            />

            <header className="bg-orange-900 text-white relative overflow-hidden py-12 text-center">
                 <div className="absolute inset-0 bg-white/5 opacity-50" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}></div>
                <div className="max-w-3xl mx-auto px-4 relative z-10">
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Evidence-Based Insights for Modern Medicine</h1>
                    <p className="text-lg text-orange-100 mb-6">AI-powered clinical decision support, documentation tips, and practice efficiency strategies</p>
                    <div className="max-w-xl mx-auto">
                        <div className="relative">
                            <input 
                                type="text" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && setSearchTerm(searchTerm.trim())}
                                className="w-full py-3 pl-5 pr-32 rounded-full text-stone-800 focus:outline-none focus:ring-4 focus:ring-orange-300" 
                                placeholder="Search articles..." 
                            />
                            {searchTerm ? (
                                <button 
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-stone-500 hover:bg-stone-600 text-white font-semibold py-2 px-6 rounded-full"
                                >
                                    Clear
                                </button>
                            ) : (
                                <button 
                                    onClick={() => setSearchTerm(searchTerm.trim())}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-orange-800 hover:bg-orange-700 text-white font-semibold py-2 px-6 rounded-full"
                                >
                                    Search
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="bg-stone-100 py-8 border-b border-stone-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center flex-wrap gap-4">
                    {categories.map(cat => (
                        <button 
                          key={cat} 
                          onClick={() => setActiveCategory(cat)}
                          className={`px-5 py-2 rounded-full font-semibold transition-all duration-300 ${activeCategory === cat ? 'bg-orange-900 text-white shadow-lg' : 'bg-white text-orange-900 border-2 border-orange-900 hover:bg-orange-900 hover:text-white hover:-translate-y-0.5'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">Latest Clinical Resources</h2>
                    {searchTerm && (
                        <p className="text-stone-600">
                            {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''} found for "{searchTerm}"
                        </p>
                    )}
                </div>
                
                {filteredPosts.length === 0 && searchTerm ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-2xl font-bold text-stone-800 mb-2">No articles found</h3>
                        <p className="text-stone-600 mb-6">Try adjusting your search terms or browse by category above.</p>
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="bg-orange-900 hover:bg-orange-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                        >
                            Clear Search
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Featured Card */}
                        {featuredPost && !searchTerm && (
                            <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-br from-orange-900 to-amber-700 text-white rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
                                <div className="md:w-1/3 h-64 md:h-auto bg-amber-600 flex items-center justify-center text-7xl relative">
                                    <span>{featuredPost.icon}</span>
                                    <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                        Featured
                                    </div>
                                </div>
                                <div className="p-8 md:p-10 flex flex-col justify-center md:w-2/3">
                                    <div className="flex items-center gap-2 mb-2 text-sm text-orange-200">
                                        <span className="font-semibold uppercase tracking-wider">{featuredPost.category}</span>
                                        <span>•</span>
                                        <span>{featuredPost.date}</span>
                                    </div>
                                    <h3 className="text-3xl font-bold mb-4 leading-tight">{featuredPost.title}</h3>
                                    <p className="text-orange-100 mb-6">{featuredPost.excerpt}</p>
                                    <div className="mt-auto flex justify-between items-center text-sm">
                                        <span className="flex items-center gap-2 text-orange-200"><ClockIcon className="w-5 h-5"/> {featuredPost.readTime} min read</span>
                                        <button 
                                            onClick={() => onNavigateToBlogPost(featuredPost.slug)}
                                            className="font-bold flex items-center gap-1 group text-white hover:underline"
                                        >
                                            Read Article <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {filteredPosts.map((post) => <BlogCard key={post.slug} post={post} onNavigateToBlogPost={onNavigateToBlogPost} />)}
                    </div>
                )}
            </main>

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

export default BlogPage;
