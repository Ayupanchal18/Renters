import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { posts } from "../data/mock";
import { Link } from "react-router-dom";
import { Calendar, User, ArrowRight } from "lucide-react";

export default function Blog() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <h1 className="heading-1 mb-4">Our Blog</h1>
                    <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
                        Insights, tips, and guides to help you navigate the real estate market with confidence.
                    </p>
                </div>

                {/* Blog Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {posts.map((p) => (
                        <article 
                            key={p.id} 
                            className="group bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                        >
                            {/* Image Container */}
                            <div className="relative overflow-hidden">
                                <img
                                    src={p.cover}
                                    alt={p.title}
                                    className="w-full h-52 object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {/* Meta Info */}
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                    <span className="flex items-center gap-1.5">
                                        <User className="w-4 h-4" />
                                        {p.author}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(p.date).toLocaleDateString('en-US', { 
                                            month: 'short', 
                                            day: 'numeric', 
                                            year: 'numeric' 
                                        })}
                                    </span>
                                </div>

                                {/* Title */}
                                <h2 className="heading-4 mb-3 group-hover:text-primary transition-colors duration-200 line-clamp-2">
                                    {p.title}
                                </h2>

                                {/* Excerpt */}
                                <p className="body-sm line-clamp-2 mb-4">
                                    {p.excerpt}
                                </p>

                                {/* Read More Link */}
                                <Link 
                                    to={`/blog/${p.id}`} 
                                    className="inline-flex items-center gap-2 text-primary font-medium text-sm hover:gap-3 transition-all duration-200"
                                >
                                    Read more
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>

                {/* Empty State */}
                {posts.length === 0 && (
                    <div className="fallback-content">
                        <p className="fallback-content-title">No posts yet</p>
                        <p className="fallback-content-message">Check back soon for new articles!</p>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
