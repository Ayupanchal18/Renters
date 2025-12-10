// import { useState, useEffect } from "react";
// import { PropertyCard } from "./property-card";
// import { MapPlaceholder } from "./map-placeholder";
// import { getAllProperties } from "../../redux/slices/propertySlice";
// import { useDispatch } from "react-redux";

// export function ListingsGrid({ viewMode, filters, searchQuery, sortBy, page }) {
//     const dispatch = useDispatch()
//     const [properties, setProperties] = useState([]);
//     const [loading, setLoading] = useState(true);

//     // Fetch all properties

//     const getallProperties = async () => {
//         setLoading(true);

//         try {
//             const response = await dispatch(getAllProperties())
//             const data = response?.payload?.items
//             setProperties(data);
//             setLoading(false);
//         } catch (error) {
//             console.log(error)
//         }
//     }

//     useEffect(() => {
//         getallProperties()
//     }, [])

//     if (viewMode === "map") {
//         return <MapPlaceholder />;
//     }



//     return (
//         <div>
//             {viewMode === "grid" ? (
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                     {properties?.map((property) => (
//                         <PropertyCard key={property._id} property={property} viewMode="grid" />
//                     ))}
//                 </div>
//             ) : (
//                 <div className="space-y-4">
//                     {properties.map((property) => (
//                         <PropertyCard key={property._id} property={property} viewMode="list" />
//                     ))}
//                 </div>
//             )}

//             {loading && properties.length === 0 && (
//                 <div className="flex items-center justify-center py-12">
//                     <div className="text-muted-foreground">Loading properties...</div>
//                 </div>
//             )}
//         </div>
//     );
// }
import { PropertyCard } from "./property-card";
import { MapPlaceholder } from "./map-placeholder";

export function ListingsGrid({ viewMode, properties = [], loading }) {
    // If map view, show placeholder
    if (viewMode === "map") {
        return <MapPlaceholder />;
    }

    return (
        <div>
            {/* GRID VIEW */}
            {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties?.map((property) => (
                        <PropertyCard key={property._id} property={property} viewMode="grid" />
                    ))}
                </div>
            ) : (
                /* LIST VIEW */
                <div className="space-y-4">
                    {properties?.map((property) => (
                        <PropertyCard key={property._id} property={property} viewMode="list" />
                    ))}
                </div>
            )}

            {/* Loading State */}
            {loading && properties.length === 0 && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-muted-foreground">Loading properties...</div>
                </div>
            )}

            {/* Empty Result State */}
            {!loading && properties.length === 0 && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-muted-foreground">No properties found.</div>
                </div>
            )}
        </div>
    );
}