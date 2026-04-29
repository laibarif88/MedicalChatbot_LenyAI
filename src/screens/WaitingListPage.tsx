import React from 'react';
import Header from '../components/Header';
import { MailIcon } from '../components/icons/MailIcon';
import { ArrowRightIcon } from '../components/icons/ArrowRightIcon';

interface WaitingListPageProps {
    onReturnToHome: () => void;
}

const WaitingListPage: React.FC<WaitingListPageProps> = ({ onReturnToHome }) => {
    return (
        <div className="bg-stone-50 min-h-screen flex flex-col">
            <Header 
                variant="solid"
                onNavigateToHome={onReturnToHome}
                onNavigateToBlog={() => {}}
                onNavigateToWaitingList={() => {}}
                onNavigateToSignUp={() => {}}
            />
            <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl w-full text-center">
                    <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-xl">
                        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-orange-100 mb-6">
                            <MailIcon className="h-10 w-10 text-orange-900" />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 mb-3">Join the Waiting List</h1>
                        <p className="text-lg text-stone-600 mb-8">
                            Be the first to get access to new features, AI-powered tools, and exclusive content designed for healthcare professionals.
                        </p>
                        <form className="max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="sr-only">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        className="w-full px-5 py-3 border border-stone-300 rounded-lg placeholder-stone-500 text-stone-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-800 transition"
                                        placeholder="Your Full Name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="sr-only">Email address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        className="w-full px-5 py-3 border border-stone-300 rounded-lg placeholder-stone-500 text-stone-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-800 transition"
                                        placeholder="your.email@hospital.org"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="mt-8 w-full flex items-center justify-center gap-2 px-6 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-[#C8824A] hover:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-800 transition-colors group"
                            >
                                Get Early Access
                                <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </button>
                        </form>
                    </div>
                    <p className="mt-6 text-sm text-stone-500">We respect your privacy. No spam, ever.</p>
                </div>
            </main>
            <footer className="bg-stone-200">
                <div className="max-w-3xl mx-auto text-center py-16 px-4">
                    <h3 className="text-3xl font-bold mb-3">Get Weekly Clinical Updates</h3>
                    <p className="text-stone-600 mb-8">Join 10,000+ providers receiving evidence-based insights and AI tips every Tuesday.</p>
                    <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
                        <input type="email" placeholder="Your email address" className="flex-grow py-3 px-4 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-800" />
                        <button type="submit" className="bg-orange-900 hover:bg-orange-800 text-white font-bold py-3 px-6 rounded-lg transition-colors">Subscribe Free</button>
                    </form>
                </div>
            </footer>
        </div>
    );
};

export default WaitingListPage;
