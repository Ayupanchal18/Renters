import { useParams, Link } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { posts } from "../data/mock";
import { Calendar, User, ArrowLeft, Clock } from "lucide-react";

export default function BlogPost() {
    const { slug } = useParams();
    const post = posts.find((p) => p.id === slug);

    if (!post) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="max-w-3xl mx-auto px-4 py-16">
                    <div className="error-state">
                        <div className="error-state-title">Post not found</div>
                        <p className="error-state-message">
                            The article you're looking for doesn't exist or has been removed.
                        </p>
                        <Link 
                            to="/blog" 
                            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Blog
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // Estimate reading time (rough: 200 words per minute)
    const wordCount = post.content?.split(/\s+/).length || 0;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* Back Link */}
                <Link 
                    to="/blog" 
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Back to Blog</span>
                </Link>

                {/* Hero Image */}
                <div className="relative rounded-2xl overflow-hidden mb-8 shadow-lg">
                    <img
                        src={post.cover}
                        className="w-full h-64 sm:h-80 lg:h-96 object-cover"
                        alt={post.title}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </div>

                {/* Article Header */}
                <header className="mb-8">
                    <h1 className="heading-1 mb-6">{post.title}</h1>
                    
                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">{post.author}</p>
                                <p className="text-xs text-muted-foreground">Author</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-sm">
                            <Calendar className="w-4 h-4" />
                            {new Date(post.date).toLocaleDateString('en-US', { 
                                month: 'long', 
                                day: 'numeric', 
                                year: 'numeric' 
                            })}
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-sm">
                            <Clock className="w-4 h-4" />
                            {readingTime} min read
                        </div>
                    </div>
                </header>

                {/* Divider */}
                <hr className="border-border mb-8" />

                {/* Article Content */}
                <article className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90 prose-a:text-primary prose-strong:text-foreground">
                    <p className="body-lg leading-relaxed text-foreground/90">
                        {post.content}
                    </p>
                </article>

                {/* Share / CTA Section */}
                <div className="mt-12 pt-8 border-t border-border">
                    <div className="bg-muted/50 rounded-xl p-6 sm:p-8 text-center">
                        <h3 className="heading-4 mb-2">Enjoyed this article?</h3>
                        <p className="body-sm mb-4">
                            Explore more insights and tips on our blog.
                        </p>
                        <Link 
                            to="/blog" 
                            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                        >
                            View All Articles
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
