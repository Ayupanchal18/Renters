import { useState } from "react";
import PropertyWizard from "../components/post-property/property-wizard";
import Navbar from './../components/Navbar';
import Footer from './../components/Footer';

export default function PostPropertyPage() {
    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
                <PropertyWizard />
            </div>
            <Footer />
        </>
    );
}
