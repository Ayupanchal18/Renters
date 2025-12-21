import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { authenticatedFetch, getHeaders } from '../../lib/api';
import { Loader2, AlertCircle } from 'lucide-react';

/**
 * Property Form Modal Component
 * 
 * Modal for creating and editing properties
 * 
 * Requirements: 4.2 - Validate required fields and create the listing
 * Requirements: 4.3 - Update the record and log the modification
 */

const API_BASE = '/api/admin/properties';

const CATEGORIES = [
  { value: 'room', label: 'Room' },
  { value: 'flat', label: 'Flat' },
  { value: 'house', label: 'House' },
  { value: 'pg', label: 'PG' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'commercial', label: 'Commercial' }
];

const FURNISHING_OPTIONS = [
  { value: 'unfurnished', label: 'Unfurnished' },
  { value: 'semi', label: 'Semi-Furnished' },
  { value: 'fully', label: 'Fully Furnished' }
];

const OWNER_TYPES = [
  { value: 'owner', label: 'Owner' },
  { value: 'agent', label: 'Agent' },
  { value: 'builder', label: 'Builder' }
];

const PropertyFormModal = ({ open, onOpenChange, property, mode, onSaved }) => {
  const navigate = useNavigate();
  const isEdit = mode === 'edit';
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: 'room',
    propertyType: 'Residential',
    description: '',
    furnishing: 'unfurnished',
    availableFrom: '',
    city: '',
    address: '',
    monthlyRent: '',
    securityDeposit: '',
    maintenanceCharge: '',
    negotiable: false,
    bedrooms: '',
    bathrooms: '',
    builtUpArea: '',
    floorNumber: '',
    totalFloors: '',
    ownerId: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    ownerType: 'owner',
    status: 'active',
    featured: false
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('basic');

  // Reset form when modal opens/closes or property changes
  useEffect(() => {
    if (open) {
      if (isEdit && property) {
        const ownerId = property.ownerId?._id || property.ownerId || '';
        setFormData({
          title: property.title || '',
          category: property.category || 'room',
          propertyType: property.propertyType || 'Residential',
          description: property.description || '',
          furnishing: property.furnishing || 'unfurnished',
          availableFrom: property.availableFrom ? new Date(property.availableFrom).toISOString().split('T')[0] : '',
          city: property.city || '',
          address: property.address || '',
          monthlyRent: property.monthlyRent?.toString() || '',
          securityDeposit: property.securityDeposit?.toString() || '',
          maintenanceCharge: property.maintenanceCharge?.toString() || '',
          negotiable: property.negotiable || false,
          bedrooms: property.bedrooms?.toString() || '',
          bathrooms: property.bathrooms?.toString() || '',
          builtUpArea: property.builtUpArea?.toString() || '',
          floorNumber: property.floorNumber?.toString() || '',
          totalFloors: property.totalFloors?.toString() || '',
          ownerId: ownerId,
          ownerName: property.ownerName || property.ownerId?.name || '',
          ownerPhone: property.ownerPhone || property.ownerId?.phone || '',
          ownerEmail: property.ownerEmail || property.ownerId?.email || '',
          ownerType: property.ownerType || 'owner',
          status: property.status || 'active',
          featured: property.featured || false
        });
      } else {
        setFormData({
          title: '',
          category: 'room',
          propertyType: 'Residential',
          description: '',
          furnishing: 'unfurnished',
          availableFrom: new Date().toISOString().split('T')[0],
          city: '',
          address: '',
          monthlyRent: '',
          securityDeposit: '',
          maintenanceCharge: '',
          negotiable: false,
          bedrooms: '',
          bathrooms: '',
          builtUpArea: '',
          floorNumber: '',
          totalFloors: '',
          ownerId: '',
          ownerName: '',
          ownerPhone: '',
          ownerEmail: '',
          ownerType: 'owner',
          status: 'active',
          featured: false
        });
      }
      setError(null);
      setErrors({});
      setActiveTab('basic');
    }
  }, [open, property, isEdit]);

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.monthlyRent || parseFloat(formData.monthlyRent) <= 0) {
      newErrors.monthlyRent = 'Valid monthly rent is required';
    }
    
    if (!isEdit) {
      if (!formData.ownerId.trim()) {
        newErrors.ownerId = 'Owner ID is required';
      }
      if (!formData.ownerName.trim()) {
        newErrors.ownerName = 'Owner name is required';
      }
      if (!formData.ownerPhone.trim()) {
        newErrors.ownerPhone = 'Owner phone is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const submitData = {
        ...formData,
        monthlyRent: parseFloat(formData.monthlyRent) || 0,
        securityDeposit: parseFloat(formData.securityDeposit) || 0,
        maintenanceCharge: parseFloat(formData.maintenanceCharge) || 0,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        builtUpArea: formData.builtUpArea ? parseFloat(formData.builtUpArea) : null,
        floorNumber: formData.floorNumber ? parseInt(formData.floorNumber) : null,
        totalFloors: formData.totalFloors ? parseInt(formData.totalFloors) : null
      };

      let response;
      
      if (isEdit) {
        // Remove owner fields for edit (can't change owner)
        delete submitData.ownerId;
        
        response = await authenticatedFetch(`${API_BASE}/${property._id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(submitData)
        }, navigate);
      } else {
        response = await authenticatedFetch(API_BASE, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(submitData)
        }, navigate);
      }
      
      const data = await response.json();
      
      if (data.success) {
        onSaved();
      } else {
        throw new Error(data.message || `Failed to ${isEdit ? 'update' : 'create'} property`);
      }
    } catch (err) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} property:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'location', label: 'Location' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'details', label: 'Details' },
    { id: 'owner', label: 'Owner' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Property' : 'Create New Property'}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Update property information. Changes will be logged.'
              : 'Fill in the details to create a new property listing.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Banner */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          
          {/* Tabs */}
          <div className="flex gap-1 border-b border-border overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Title <span className="text-destructive">*</span>
                </label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Enter property title"
                />
                {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category <span className="text-destructive">*</span></label>
                  <Select value={formData.category} onValueChange={(v) => handleChange('category', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Furnishing</label>
                  <Select value={formData.furnishing} onValueChange={(v) => handleChange('furnishing', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FURNISHING_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Enter property description"
                  className="w-full min-h-[100px] px-3 py-2 border border-input rounded-md bg-background text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="availableFrom" className="text-sm font-medium">Available From</label>
                <Input
                  id="availableFrom"
                  type="date"
                  value={formData.availableFrom}
                  onChange={(e) => handleChange('availableFrom', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Location Tab */}
          {activeTab === 'location' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="city" className="text-sm font-medium">
                  City <span className="text-destructive">*</span>
                </label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Enter city"
                />
                {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium">
                  Address <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Enter full address"
                  className="w-full min-h-[80px] px-3 py-2 border border-input rounded-md bg-background text-sm"
                />
                {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
              </div>
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="monthlyRent" className="text-sm font-medium">
                  Monthly Rent (₹) <span className="text-destructive">*</span>
                </label>
                <Input
                  id="monthlyRent"
                  type="number"
                  value={formData.monthlyRent}
                  onChange={(e) => handleChange('monthlyRent', e.target.value)}
                  placeholder="Enter monthly rent"
                />
                {errors.monthlyRent && <p className="text-sm text-destructive">{errors.monthlyRent}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="securityDeposit" className="text-sm font-medium">Security Deposit (₹)</label>
                  <Input
                    id="securityDeposit"
                    type="number"
                    value={formData.securityDeposit}
                    onChange={(e) => handleChange('securityDeposit', e.target.value)}
                    placeholder="Enter deposit"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="maintenanceCharge" className="text-sm font-medium">Maintenance (₹)</label>
                  <Input
                    id="maintenanceCharge"
                    type="number"
                    value={formData.maintenanceCharge}
                    onChange={(e) => handleChange('maintenanceCharge', e.target.value)}
                    placeholder="Enter maintenance"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="negotiable"
                  checked={formData.negotiable}
                  onChange={(e) => handleChange('negotiable', e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <label htmlFor="negotiable" className="text-sm font-medium">Price is negotiable</label>
              </div>
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="bedrooms" className="text-sm font-medium">Bedrooms</label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => handleChange('bedrooms', e.target.value)}
                    placeholder="No. of bedrooms"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="bathrooms" className="text-sm font-medium">Bathrooms</label>
                  <Input
                    id="bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => handleChange('bathrooms', e.target.value)}
                    placeholder="No. of bathrooms"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="builtUpArea" className="text-sm font-medium">Built-up Area (sq.ft)</label>
                <Input
                  id="builtUpArea"
                  type="number"
                  value={formData.builtUpArea}
                  onChange={(e) => handleChange('builtUpArea', e.target.value)}
                  placeholder="Enter area"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="floorNumber" className="text-sm font-medium">Floor Number</label>
                  <Input
                    id="floorNumber"
                    type="number"
                    value={formData.floorNumber}
                    onChange={(e) => handleChange('floorNumber', e.target.value)}
                    placeholder="Floor no."
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="totalFloors" className="text-sm font-medium">Total Floors</label>
                  <Input
                    id="totalFloors"
                    type="number"
                    value={formData.totalFloors}
                    onChange={(e) => handleChange('totalFloors', e.target.value)}
                    placeholder="Total floors"
                  />
                </div>
              </div>
              
              {isEdit && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                        <SelectItem value="rented">Rented</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Featured</label>
                    <div className="flex items-center gap-2 h-10">
                      <input
                        type="checkbox"
                        id="featured"
                        checked={formData.featured}
                        onChange={(e) => handleChange('featured', e.target.checked)}
                        className="h-4 w-4 rounded border-input"
                      />
                      <label htmlFor="featured" className="text-sm">Mark as featured</label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Owner Tab */}
          {activeTab === 'owner' && (
            <div className="space-y-4">
              {!isEdit && (
                <div className="space-y-2">
                  <label htmlFor="ownerId" className="text-sm font-medium">
                    Owner ID <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="ownerId"
                    value={formData.ownerId}
                    onChange={(e) => handleChange('ownerId', e.target.value)}
                    placeholder="Enter owner user ID"
                  />
                  {errors.ownerId && <p className="text-sm text-destructive">{errors.ownerId}</p>}
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="ownerName" className="text-sm font-medium">
                  Owner Name {!isEdit && <span className="text-destructive">*</span>}
                </label>
                <Input
                  id="ownerName"
                  value={formData.ownerName}
                  onChange={(e) => handleChange('ownerName', e.target.value)}
                  placeholder="Enter owner name"
                  disabled={isEdit}
                />
                {errors.ownerName && <p className="text-sm text-destructive">{errors.ownerName}</p>}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="ownerPhone" className="text-sm font-medium">
                  Owner Phone {!isEdit && <span className="text-destructive">*</span>}
                </label>
                <Input
                  id="ownerPhone"
                  value={formData.ownerPhone}
                  onChange={(e) => handleChange('ownerPhone', e.target.value)}
                  placeholder="Enter owner phone"
                  disabled={isEdit}
                />
                {errors.ownerPhone && <p className="text-sm text-destructive">{errors.ownerPhone}</p>}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="ownerEmail" className="text-sm font-medium">Owner Email</label>
                <Input
                  id="ownerEmail"
                  type="email"
                  value={formData.ownerEmail}
                  onChange={(e) => handleChange('ownerEmail', e.target.value)}
                  placeholder="Enter owner email"
                  disabled={isEdit}
                />
              </div>
              
              {!isEdit && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Owner Type</label>
                  <Select value={formData.ownerType} onValueChange={(v) => handleChange('ownerType', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OWNER_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Property'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyFormModal;
