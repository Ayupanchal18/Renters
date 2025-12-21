import { useState } from "react";
import PropertyWizard from "../components/post-property/property-wizard";
import Navbar from './../components/Navbar';
import Footer from './../components/Footer';

export default function PostPropertyPage() {
    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-background">
                <PropertyWizard />
            </div>
            <Footer />
        </>
    );
}
