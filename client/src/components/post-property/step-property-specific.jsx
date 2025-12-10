import { Input } from "../ui/input";

export default function StepPropertySpecific({ formData, setFormData, validationErrors }) {
    const isRoom = formData.category === "room";
    const isApartment = formData.category === "apartment";
    const isCommercial = formData.category === "commercial";

    const updateData = (updates) => {
        setFormData({ ...formData, ...updates });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Property Specifications</h2>

            {/* ROOM CATEGORY */}
            {isRoom && (
                <>
                    {/* Room Type */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-3">Room Type</label>
                        <div className="flex gap-4">
                            {["single", "double", "triple"].map((type) => (
                                <label key={type} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value={type}
                                        checked={formData.roomType === type}
                                        onChange={(e) => updateData({ roomType: e.target.value })}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-slate-700 capitalize">{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Bathroom Type */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-3">Bathroom Type</label>
                        <div className="flex gap-4">
                            {["attached", "common"].map((type) => (
                                <label key={type} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value={type}
                                        checked={formData.bathroomType === type}
                                        onChange={(e) => updateData({ bathroomType: e.target.value })}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-slate-700 capitalize">{type} Bathroom</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Kitchen */}
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.kitchenAvailable}
                            onChange={(e) => updateData({ kitchenAvailable: e.target.checked })}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600"
                        />
                        <span className="text-slate-700 font-medium">Kitchen Available</span>
                    </label>
                </>
            )}

            {/* APARTMENT CATEGORY */}
            {isApartment && (
                <>
                    {/* Areas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-900 mb-2">Built-up Area (sq ft)</label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={formData.builtUpArea}
                                onChange={(e) => updateData({ builtUpArea: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-900 mb-2">Carpet Area (sq ft)</label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={formData.carpetArea}
                                onChange={(e) => updateData({ carpetArea: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Rooms, Bathrooms, Balconies */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Bedrooms */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-900 mb-2">Bedrooms</label>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() =>
                                        updateData({ bedrooms: Math.max(0, parseInt(formData.bedrooms) - 1).toString() })
                                    }
                                    className="px-3 py-1 bg-slate-200 rounded hover:bg-slate-300"
                                >
                                    −
                                </button>
                                <Input
                                    type="number"
                                    value={formData.bedrooms}
                                    onChange={(e) => updateData({ bedrooms: e.target.value })}
                                    className="text-center"
                                />
                                <button
                                    onClick={() =>
                                        updateData({ bedrooms: (parseInt(formData.bedrooms) + 1).toString() })
                                    }
                                    className="px-3 py-1 bg-slate-200 rounded hover:bg-slate-300"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Bathrooms */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-900 mb-2">Bathrooms</label>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() =>
                                        updateData({ bathrooms: Math.max(0, parseInt(formData.bathrooms) - 1).toString() })
                                    }
                                    className="px-3 py-1 bg-slate-200 rounded hover:bg-slate-300"
                                >
                                    −
                                </button>
                                <Input
                                    type="number"
                                    value={formData.bathrooms}
                                    onChange={(e) => updateData({ bathrooms: e.target.value })}
                                    className="text-center"
                                />
                                <button
                                    onClick={() =>
                                        updateData({ bathrooms: (parseInt(formData.bathrooms) + 1).toString() })
                                    }
                                    className="px-3 py-1 bg-slate-200 rounded hover:bg-slate-300"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Balconies */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-900 mb-2">Balconies</label>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() =>
                                        updateData({ balconies: Math.max(0, parseInt(formData.balconies) - 1).toString() })
                                    }
                                    className="px-3 py-1 bg-slate-200 rounded hover:bg-slate-300"
                                >
                                    −
                                </button>
                                <Input
                                    type="number"
                                    value={formData.balconies}
                                    onChange={(e) => updateData({ balconies: e.target.value })}
                                    className="text-center"
                                />
                                <button
                                    onClick={() =>
                                        updateData({ balconies: (parseInt(formData.balconies) + 1).toString() })
                                    }
                                    className="px-3 py-1 bg-slate-200 rounded hover:bg-slate-300"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Floor Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-900 mb-2">Floor Number</label>
                            <Input
                                type="number"
                                value={formData.floorNumber}
                                onChange={(e) => updateData({ floorNumber: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-900 mb-2">Total Floors</label>
                            <Input
                                type="number"
                                value={formData.totalFloors}
                                onChange={(e) => updateData({ totalFloors: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Directions + Age */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Direction */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-900 mb-2">Facing Direction</label>
                            <select
                                value={formData.facingDirection}
                                onChange={(e) => updateData({ facingDirection: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none"
                            >
                                <option value="">Select direction</option>
                                {["North", "South", "East", "West", "Northeast", "Northwest", "Southeast", "Southwest"].map(
                                    (dir) => (
                                        <option key={dir} value={dir}>
                                            {dir}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        {/* Age */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-900 mb-2">Property Age</label>
                            <select
                                value={formData.propertyAge}
                                onChange={(e) => updateData({ propertyAge: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none"
                            >
                                <option value="">Select age</option>
                                {["New", "0-5 years", "5-10 years", "10+ years"].map((age) => (
                                    <option key={age} value={age}>
                                        {age}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Parking */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-3">Parking</label>
                        <div className="flex gap-4">
                            {["2-wheeler", "4-wheeler", "both", "none"].map((type) => (
                                <label key={type} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value={type}
                                        checked={formData.parking === type}
                                        onChange={(e) => updateData({ parking: e.target.value })}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-slate-700 capitalize">{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* COMMERCIAL CATEGORY */}
            {isCommercial && (
                <>
                    {/* Areas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-900 mb-2">Built-up Area (sq ft)</label>
                            <Input
                                type="number"
                                value={formData.builtUpArea}
                                onChange={(e) => updateData({ builtUpArea: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-900 mb-2">Carpet Area (sq ft)</label>
                            <Input
                                type="number"
                                value={formData.carpetArea}
                                onChange={(e) => updateData({ carpetArea: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Washroom + Frontage */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Washroom */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-900 mb-3">Washroom</label>
                            <div className="flex gap-4">
                                {["private", "shared"].map((type) => (
                                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            value={type}
                                            checked={formData.washroom === type}
                                            onChange={(e) => updateData({ washroom: e.target.value })}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-slate-700 capitalize">{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Frontage */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-900 mb-2">Frontage (meters)</label>
                            <Input
                                type="number"
                                value={formData.frontage}
                                onChange={(e) => updateData({ frontage: e.target.value })}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
