import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { Construction } from "lucide-react";
export default function Placeholder({ title, description }) {
    return (_jsxs("div", { className: "min-h-screen bg-white flex flex-col", children: [_jsx(Navbar, {}), _jsx("div", { className: "flex-1 flex items-center justify-center px-4 py-16", children: _jsxs("div", { className: "text-center max-w-2xl", children: [_jsx(Construction, { className: "h-24 w-24 text-blue-600 mx-auto mb-6" }), _jsx("h1", { className: "text-4xl font-bold text-gray-900 mb-4", children: title }), _jsx("p", { className: "text-xl text-gray-600 mb-8", children: description || "This page is under construction. We're working hard to bring you this feature soon!" }), _jsxs("div", { className: "flex gap-4 justify-center flex-wrap", children: [_jsx(Link, { to: "/", children: _jsx(Button, { size: "lg", className: "bg-blue-600 hover:bg-blue-700", children: "Return Home" }) }), _jsx(Link, { to: "/listings", children: _jsx(Button, { size: "lg", variant: "outline", children: "Browse Properties" }) })] })] }) }), _jsx(Footer, {})] }));
}
