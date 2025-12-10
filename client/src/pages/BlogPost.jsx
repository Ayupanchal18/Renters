import { useParams } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { posts } from "../data/mock";

export default function BlogPost() {
    const { slug } = useParams();
    const post = posts.find((p) => p.id === slug);

    if (!post) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Post not found
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="max-w-3xl mx-auto px-4 py-12">
                <img
                    src={post.cover}
                    className="w-full h-56 object-cover rounded mb-6"
                    alt={post.title}
                />

                <h1 className="text-3xl font-bold">{post.title}</h1>

                <div className="text-sm text-gray-500 mb-6">
                    By {post.author} • {post.date}
                </div>

                <div className="prose max-w-none">{post.content}</div>
            </main>

            <Footer />
        </div>
    );
}
