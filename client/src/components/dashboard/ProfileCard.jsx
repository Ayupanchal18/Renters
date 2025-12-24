import React from "react";
import { User, Plus, TrendingUp, ChevronRight, AlertCircle } from "lucide-react";
import { getCompletionStatusText, getCompletionColor } from "../../utils/profileCompletion";

export default function ProfileCard({ user, completion = 0, completionData, onPostProperty }) {
    const completionColor = getCompletionColor(completion);
    const completionText = getCompletionStatusText(completion);

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/85 rounded-2xl p-6 shadow-lg h-full">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
                {/* User Info */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-2 ring-white/30">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-xl object-cover" />
                        ) : (
                            <User size={28} className="text-white" />
                        )}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">{user.name}</h2>
                        <p className="text-white/70 text-sm">{user.email}</p>
                    </div>
                </div>

                {/* Completion Progress */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-5">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={16} className="text-white/80" />
                            <span className="text-sm font-medium text-white/90">Profile Completion</span>
                        </div>
                        <span className="text-sm font-bold text-white">{completion}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2.5 mb-2">
                        <div
                            className={`bg-gradient-to-r ${completionColor} rounded-full h-2.5 transition-all duration-500 ease-out`}
                            style={{ width: `${completion}%` }}
                        />
                    </div>
                    <p className="text-xs text-white/60">{completionText}</p>
                    
                    {/* Next Step Hint */}
                    {completionData?.nextStep && completion < 100 && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                            <div className="flex items-start gap-2">
                                <AlertCircle size={14} className="text-white/70 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-white/70">Next step:</p>
                                    <p className="text-xs font-medium text-white/90">
                                        {completionData.nextStep.label}
                                        <span className="text-white/50 ml-1">
                                            (+{completionData.nextStep.weight}%)
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Post Property Button */}
                <button
                    onClick={onPostProperty}
                    className="w-full group flex items-center justify-center gap-2 bg-white hover:bg-white/95 text-primary font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                    <Plus size={18} className="transition-transform group-hover:rotate-90 duration-200" />
                    <span>Post Property</span>
                    <ChevronRight size={16} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                </button>
            </div>
        </div>
    );
}
