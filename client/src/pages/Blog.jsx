import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { posts } from "../data/mock";
import { Link } from "react-router-dom";

export default function Blog() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="max-w-5xl mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold mb-6">Blog</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {posts.map((p) => (
                        <article key={p.id} className="border rounded overflow-hidden">
                            <img
                                src={p.cover}
                                alt={p.title}
                                className="w-full h-44 object-cover"
                            />

                            <div className="p-4">
                                <h2 className="font-semibold text-lg">{p.title}</h2>

                                <p className="text-sm text-gray-600 mt-2">{p.excerpt}</p>

                                <div className="mt-4">
                                    <Link to={`/blog/${p.id}`} className="text-blue-600">
                                        Read more
                                    </Link>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </main>

            <Footer />
        </div>
    );
}
