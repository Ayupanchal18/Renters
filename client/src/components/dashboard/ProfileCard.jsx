import { User } from "lucide-react";

export default function ProfileCard({ user, completion = 45, onPostProperty }) {
    return (
        <div className="bg-gradient-to-br from-primary via-primary/80 to-primary/60 rounded-lg p-8 shadow-lg">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                        <User size={32} className="" />
                    </div>
                    <h2 className="text-3xl font-bold text-balance">{user.name}</h2>
                </div>
            </div>

            {/* Completion Progress */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Profile Completion</span>
                    <span className="text-sm font-semibold">{completion}%</span>
                </div>
                <div className="w-full bg-black/20 rounded-full h-2">
                    <div
                        className="bg-red-500 rounded-full h-2 transition-all duration-300"
                        style={{ width: `${completion}%` }}
                    ></div>
                </div>
            </div>

            <button
                onClick={onPostProperty}
                className="w-full bg-accent hover:bg-accent/90  font-semibold py-3 px-4 rounded-lg transition-colors"
            >
                + Post Property
            </button>
        </div>
    );
}
