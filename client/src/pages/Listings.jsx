
import { useState, useEffect, useRef } from "react";
import { HeroSection } from "../components/all_listing/hero-section";
import { FilterSidebar } from "../components/all_listing/filter-sidebar";
import { ListingsGrid } from "../components/all_listing/listings-grid";
import { ViewControls } from "../components/all_listing/view-controls";
import Navbar from "./../components/Navbar";
import Footer from "./../components/Footer";
import { useDispatch } from "react-redux";
import { getAllProperties } from "../redux/slices/propertySlice";
import { searchResults } from "../redux/slices/searchSlice";
import { useLocation } from "react-router-dom";

export default function ListingsPage() {
    const dispatch = useDispatch();

    // Data states
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI states
    const [viewMode, setViewMode] = useState("grid");
    const [sortBy, setSortBy] = useState("newest");

    const location = useLocation();
    const initialSearchData = location.state?.searchData || null;

    // Validate search payload
    const isSearchValid = (d) => {
        if (!d) return false;
        return d.location?.trim() && d.type?.trim() && d.query?.trim();
    };

    // Load All Properties
    const fetchAll = async () => {
        setLoading(true);
        try {
            const res = await dispatch(getAllProperties());
            setProperties(res?.payload?.items || []);
        } catch (e) {
            console.log(e);
        }
        setLoading(false);
    };

    // Initial Search (from Home or Hero)
    const runInitialSearch = async () => {
        setLoading(true);
        try {
            const res = await dispatch(searchResults(initialSearchData));
            setProperties(res?.payload?.data || []);
        } catch (e) {
            console.log(e);
        }
        setLoading(false);
    };

    // Hero Section Search (search again from listing page)
    const handleHeroSearch = async (payload) => {
        if (!isSearchValid(payload)) return;

        setLoading(true);
        try {
            const res = await dispatch(searchResults(payload));
            setProperties(res?.payload?.data || []);
        } catch (e) {
            console.log(e);
        }
        setLoading(false);
    };

    // On Page Load: run search OR load all
    useEffect(() => {
        if (isSearchValid(initialSearchData)) runInitialSearch();
        else fetchAll();
    }, []);

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-background">

                {/* SEARCH BAR */}
                <HeroSection onSearch={handleHeroSearch} />

                <div className="max-w-7xl mx-auto px-4 py-8 flex gap-6">

                    {/* IGNORE FILTERS FOR NOW */}
                    {/* <FilterSidebar filters={{}} onFilterChange={() => { }} /> */}

                    <div className="flex-1 min-w-0">

                        {/* View Controls */}
                        <ViewControls
                            viewMode={viewMode}
                            onViewChange={setViewMode}
                            sortBy={sortBy}
                            onSortChange={setSortBy}
                            properties={properties}
                        />

                        {/* Property Grid/List */}
                        <ListingsGrid
                            viewMode={viewMode}
                            properties={properties}
                            loading={loading}
                        />
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}

