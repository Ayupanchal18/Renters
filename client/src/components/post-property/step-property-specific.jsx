import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Minus, Plus } from "lucide-react";

export default function StepPropertySpecific({ formData, setFormData, validationErrors }) {
    // Categories: room, flat, house, pg, hostel, commercial
    const isRoom = formData.category === "room";
    const isFlat = formData.category === "flat";
    const isHouse = formData.category === "house";
    const isPG = formData.category === "pg";
    const isHostel = formData.category === "hostel";
    const isCommercial = formData.category === "commercial";
    
    // Group similar categories for shared UI sections
    const showResidentialFields = isFlat || isHouse;
    const showRoomFields = isRoom || isPG || isHostel;

    const updateData = (updates) => {
        setFormData({ ...formData, ...updates });
    };

    return (
        <div className="space-y-5 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Property Specifications</h2>

            {/* ROOM / PG / HOSTEL CATEGORIES */}
            {showRoomFields && (
                <>
                    {/* Room Type */}
                    <div className="space-y-3">
                        <Label className="text-foreground font-semibold text-sm sm:text-base">Room Type</Label>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            {["single", "double", "triple"].map((type) => (
                                <label 
                                    key={type} 
                                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all text-sm sm:text-base ${
                                        formData.roomType === type 
                                            ? "border-primary bg-primary/5" 
                                            : "border-border hover:border-primary/50"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        value={type}
                                        checked={formData.roomType === type}
                                        onChange={(e) => updateData({ roomType: e.target.value })}
                                        className="w-4 h-4 accent-primary"
                                    />
                                    <span className="text-foreground capitalize">{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Bathroom Type */}
                    <div className="space-y-3">
                        <Label className="text-foreground font-semibold text-sm sm:text-base">Bathroom Type</Label>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            {["attached", "common"].map((type) => (
                                <label 
                                    key={type} 
                                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all text-sm sm:text-base ${
                                        formData.bathroomType === type 
                                            ? "border-primary bg-primary/5" 
                                            : "border-border hover:border-primary/50"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        value={type}
                                        checked={formData.bathroomType === type}
                                        onChange={(e) => updateData({ bathroomType: e.target.value })}
                                        className="w-4 h-4 accent-primary"
                                    />
                                    <span className="text-foreground capitalize">{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Kitchen */}
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                        <input
                            type="checkbox"
                            checked={formData.kitchenAvailable}
                            onChange={(e) => updateData({ kitchenAvailable: e.target.checked })}
                            className="w-5 h-5 rounded border-input accent-primary"
                        />
                        <span className="text-foreground font-medium text-sm sm:text-base">Kitchen Available</span>
                    </label>
                </>
            )}

            {/* FLAT / HOUSE CATEGORIES */}
            {showResidentialFields && (
                <>
                    {/* Areas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="builtUpArea" className="text-foreground font-semibold text-sm sm:text-base">Built-up Area (sq ft)</Label>
                            <Input
                                id="builtUpArea"
                                type="number"
                                placeholder="0"
                                value={formData.builtUpArea}
                                onChange={(e) => updateData({ builtUpArea: e.target.value })}
                                className="text-sm sm:text-base"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="carpetArea" className="text-foreground font-semibold text-sm sm:text-base">Carpet Area (sq ft)</Label>
                            <Input
                                id="carpetArea"
                                type="number"
                                placeholder="0"
                                value={formData.carpetArea}
                                onChange={(e) => updateData({ carpetArea: e.target.value })}
                                className="text-sm sm:text-base"
                            />
                        </div>
                    </div>

                    {/* Rooms, Bathrooms, Balconies */}
                    <div className="grid grid-cols-3 gap-3 sm:gap-6">
                        {/* Bedrooms */}
                        <div className="space-y-2">
                            <Label className="text-foreground font-semibold text-xs sm:text-base">Bedrooms</Label>
                            <div className="flex items-center gap-1 sm:gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
                                    onClick={() =>
                                        updateData({ bedrooms: Math.max(0, parseInt(formData.bedrooms || 0) - 1).toString() })
                                    }
                                >
                                    <Minus size={14} />
                                </Button>
                                <Input
                                    type="number"
                                    value={formData.bedrooms}
                                    onChange={(e) => updateData({ bedrooms: e.target.value })}
                                    className="text-center text-sm px-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
                                    onClick={() =>
                                        updateData({ bedrooms: (parseInt(formData.bedrooms || 0) + 1).toString() })
                                    }
                                >
                                    <Plus size={14} />
                                </Button>
                            </div>
                        </div>

                        {/* Bathrooms */}
                        <div className="space-y-2">
                            <Label className="text-foreground font-semibold text-xs sm:text-base">Bathrooms</Label>
                            <div className="flex items-center gap-1 sm:gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
                                    onClick={() =>
                                        updateData({ bathrooms: Math.max(0, parseInt(formData.bathrooms || 0) - 1).toString() })
                                    }
                                >
                                    <Minus size={14} />
                                </Button>
                                <Input
                                    type="number"
                                    value={formData.bathrooms}
                                    onChange={(e) => updateData({ bathrooms: e.target.value })}
                                    className="text-center text-sm px-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
                                    onClick={() =>
                                        updateData({ bathrooms: (parseInt(formData.bathrooms || 0) + 1).toString() })
                                    }
                                >
                                    <Plus size={14} />
                                </Button>
                            </div>
                        </div>

                        {/* Balconies */}
                        <div className="space-y-2">
                            <Label className="text-foreground font-semibold text-xs sm:text-base">Balconies</Label>
                            <div className="flex items-center gap-1 sm:gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
                                    onClick={() =>
                                        updateData({ balconies: Math.max(0, parseInt(formData.balconies || 0) - 1).toString() })
                                    }
                                >
                                    <Minus size={14} />
                                </Button>
                                <Input
                                    type="number"
                                    value={formData.balconies}
                                    onChange={(e) => updateData({ balconies: e.target.value })}
                                    className="text-center text-sm px-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
                                    onClick={() =>
                                        updateData({ balconies: (parseInt(formData.balconies || 0) + 1).toString() })
                                    }
                                >
                                    <Plus size={14} />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Floor Details */}
                    <div className="grid grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="floorNumber" className="text-foreground font-semibold text-sm sm:text-base">Floor No.</Label>
                            <Input
                                id="floorNumber"
                                type="number"
                                value={formData.floorNumber}
                                onChange={(e) => updateData({ floorNumber: e.target.value })}
                                className="text-sm sm:text-base"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="totalFloors" className="text-foreground font-semibold text-sm sm:text-base">Total Floors</Label>
                            <Input
                                id="totalFloors"
                                type="number"
                                value={formData.totalFloors}
                                onChange={(e) => updateData({ totalFloors: e.target.value })}
                                className="text-sm sm:text-base"
                            />
                        </div>
                    </div>

                    {/* Directions + Age */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {/* Direction */}
                        <div className="space-y-2">
                            <Label htmlFor="facingDirection" className="text-foreground font-semibold text-sm sm:text-base">Facing Direction</Label>
                            <select
                                id="facingDirection"
                                value={formData.facingDirection}
                                onChange={(e) => updateData({ facingDirection: e.target.value })}
                                className="w-full px-3 py-2.5 sm:py-2 border border-input rounded-lg bg-background text-foreground text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-ring"
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
                        <div className="space-y-2">
                            <Label htmlFor="propertyAge" className="text-foreground font-semibold text-sm sm:text-base">Property Age</Label>
                            <select
                                id="propertyAge"
                                value={formData.propertyAge}
                                onChange={(e) => updateData({ propertyAge: e.target.value })}
                                className="w-full px-3 py-2.5 sm:py-2 border border-input rounded-lg bg-background text-foreground text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-ring"
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
                    <div className="space-y-3">
                        <Label className="text-foreground font-semibold text-sm sm:text-base">Parking</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                            {["2-wheeler", "4-wheeler", "both", "none"].map((type) => (
                                <label 
                                    key={type} 
                                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all text-xs sm:text-sm ${
                                        formData.parking === type 
                                            ? "border-primary bg-primary/5" 
                                            : "border-border hover:border-primary/50"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        value={type}
                                        checked={formData.parking === type}
                                        onChange={(e) => updateData({ parking: e.target.value })}
                                        className="w-4 h-4 accent-primary"
                                    />
                                    <span className="text-foreground capitalize">{type}</span>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="builtUpAreaComm" className="text-foreground font-semibold text-sm sm:text-base">Built-up Area (sq ft)</Label>
                            <Input
                                id="builtUpAreaComm"
                                type="number"
                                value={formData.builtUpArea}
                                onChange={(e) => updateData({ builtUpArea: e.target.value })}
                                className="text-sm sm:text-base"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="carpetAreaComm" className="text-foreground font-semibold text-sm sm:text-base">Carpet Area (sq ft)</Label>
                            <Input
                                id="carpetAreaComm"
                                type="number"
                                value={formData.carpetArea}
                                onChange={(e) => updateData({ carpetArea: e.target.value })}
                                className="text-sm sm:text-base"
                            />
                        </div>
                    </div>

                    {/* Washroom + Frontage */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {/* Washroom */}
                        <div className="space-y-3">
                            <Label className="text-foreground font-semibold text-sm sm:text-base">Washroom</Label>
                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                {["private", "shared"].map((type) => (
                                    <label 
                                        key={type} 
                                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all text-sm ${
                                            formData.washroom === type 
                                                ? "border-primary bg-primary/5" 
                                                : "border-border hover:border-primary/50"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            value={type}
                                            checked={formData.washroom === type}
                                            onChange={(e) => updateData({ washroom: e.target.value })}
                                            className="w-4 h-4 accent-primary"
                                        />
                                        <span className="text-foreground capitalize">{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Frontage */}
                        <div className="space-y-2">
                            <Label htmlFor="frontage" className="text-foreground font-semibold text-sm sm:text-base">Frontage (meters)</Label>
                            <Input
                                id="frontage"
                                type="number"
                                value={formData.frontage}
                                onChange={(e) => updateData({ frontage: e.target.value })}
                                className="text-sm sm:text-base"
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
