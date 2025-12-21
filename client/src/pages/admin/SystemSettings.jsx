import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { authenticatedFetch, getHeaders } from '../../lib/api';
import { cn } from '../../lib/utils';
import {
  Settings,
  ToggleLeft,
  ToggleRight,
  Shield,
  Key,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Copy,
  Check,
  Loader2,
  Wrench,
  Clock,
  X
} from 'lucide-react';

/**
 * System Settings Page
 * 
 * Admin page for managing system-wide settings with:
 * - General settings form
 * - Feature toggles
 * - Maintenance mode controls
 * - API keys management
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

const API_BASE = '/api/admin/settings';

const CATEGORY_ICONS = {
  general: Settings,
  features: ToggleLeft,
  maintenance: AlertTriangle,
  security: Shield,
  notifications: AlertCircle,
  api: Key
};

const CATEGORY_COLORS = {
  general: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  features: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  security: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  notifications: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  api: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
};


// Setting Edit Modal Component
const SettingModal = ({ open, onOpenChange, setting, onSaved }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    type: 'string',
    description: '',
    isPublic: false,
    category: 'general'
  });

  useEffect(() => {
    if (setting) {
      setFormData({
        key: setting.key || '',
        value: setting.type === 'json' ? JSON.stringify(setting.value, null, 2) : String(setting.value ?? ''),
        type: setting.type || 'string',
        description: setting.description || '',
        isPublic: setting.isPublic || false,
        category: setting.category || 'general'
      });
    } else {
      setFormData({
        key: '',
        value: '',
        type: 'string',
        description: '',
        isPublic: false,
        category: 'general'
      });
    }
    setError(null);
  }, [setting, open]);

  const parseValue = (value, type) => {
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true' || value === true;
      case 'json':
        return JSON.parse(value);
      default:
        return value;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let parsedValue;
      try {
        parsedValue = parseValue(formData.value, formData.type);
      } catch {
        throw new Error('Invalid value format for the selected type');
      }

      const url = setting ? `${API_BASE}/${setting.key}` : API_BASE;
      const method = setting ? 'PUT' : 'POST';

      const body = setting 
        ? { value: parsedValue, type: formData.type, description: formData.description, isPublic: formData.isPublic, category: formData.category }
        : { key: formData.key, value: parsedValue, type: formData.type, description: formData.description, isPublic: formData.isPublic, category: formData.category };

      const response = await authenticatedFetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(body)
      }, navigate);

      const data = await response.json();

      if (data.success) {
        onSaved();
        onOpenChange(false);
      } else {
        throw new Error(data.message || 'Failed to save setting');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {setting ? 'Edit Setting' : 'Create Setting'}
          </DialogTitle>
          <DialogDescription>
            {setting ? 'Update the system setting' : 'Create a new system setting'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {!setting && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Key</label>
              <Input
                value={formData.key}
                onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                placeholder="setting_key"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="features">Features</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="notifications">Notifications</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Value</label>
            {formData.type === 'boolean' ? (
              <Select value={String(formData.value)} onValueChange={(value) => setFormData(prev => ({ ...prev, value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            ) : formData.type === 'json' ? (
              <textarea
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder='{"key": "value"}'
                className="w-full min-h-[100px] px-3 py-2 border rounded-md bg-background text-foreground font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            ) : (
              <Input
                type={formData.type === 'number' ? 'number' : 'text'}
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder="Setting value"
                required
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this setting"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
              className="h-4 w-4 rounded border-input"
            />
            <label htmlFor="isPublic" className="text-sm">Make this setting publicly accessible</label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {setting ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


// Maintenance Mode Modal Component
const MaintenanceModeModal = ({ open, onOpenChange, currentStatus, onSaved }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    enabled: false,
    message: 'The system is currently under maintenance. Please try again later.',
    estimatedEndTime: '',
    allowedIPs: ''
  });

  useEffect(() => {
    if (currentStatus) {
      setFormData({
        enabled: currentStatus.enabled || false,
        message: currentStatus.message || 'The system is currently under maintenance. Please try again later.',
        estimatedEndTime: currentStatus.estimatedEndTime ? new Date(currentStatus.estimatedEndTime).toISOString().slice(0, 16) : '',
        allowedIPs: (currentStatus.allowedIPs || []).join(', ')
      });
    }
    setError(null);
  }, [currentStatus, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const allowedIPsArray = formData.allowedIPs
        .split(',')
        .map(ip => ip.trim())
        .filter(ip => ip.length > 0);

      const response = await authenticatedFetch(`${API_BASE}/maintenance`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          enabled: formData.enabled,
          message: formData.message,
          estimatedEndTime: formData.estimatedEndTime ? new Date(formData.estimatedEndTime).toISOString() : null,
          allowedIPs: allowedIPsArray
        })
      }, navigate);

      const data = await response.json();

      if (data.success) {
        onSaved();
        onOpenChange(false);
      } else {
        throw new Error(data.message || 'Failed to update maintenance mode');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Maintenance Mode
          </DialogTitle>
          <DialogDescription>
            Configure maintenance mode settings. When enabled, non-admin users will see a maintenance page.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Maintenance Mode</p>
              <p className="text-sm text-muted-foreground">
                {formData.enabled ? 'Currently enabled' : 'Currently disabled'}
              </p>
            </div>
            <Button
              type="button"
              variant={formData.enabled ? 'destructive' : 'default'}
              onClick={() => setFormData(prev => ({ ...prev, enabled: !prev.enabled }))}
            >
              {formData.enabled ? (
                <><ToggleRight className="h-4 w-4 mr-2" /> Enabled</>
              ) : (
                <><ToggleLeft className="h-4 w-4 mr-2" /> Disabled</>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Maintenance Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Message to display to users..."
              className="w-full min-h-[80px] px-3 py-2 border rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Estimated End Time (optional)</label>
            <Input
              type="datetime-local"
              value={formData.estimatedEndTime}
              onChange={(e) => setFormData(prev => ({ ...prev, estimatedEndTime: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Allowed IPs (optional)</label>
            <Input
              value={formData.allowedIPs}
              onChange={(e) => setFormData(prev => ({ ...prev, allowedIPs: e.target.value }))}
              placeholder="192.168.1.1, 10.0.0.1"
            />
            <p className="text-xs text-muted-foreground">Comma-separated list of IP addresses that can bypass maintenance mode</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


// API Key Modal Component
const ApiKeyModal = ({ open, onOpenChange, apiKey, onSaved }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    description: ''
  });

  useEffect(() => {
    if (apiKey) {
      setFormData({
        key: apiKey.key || '',
        value: '',
        description: apiKey.description || ''
      });
    } else {
      setFormData({
        key: '',
        value: '',
        description: ''
      });
    }
    setError(null);
  }, [apiKey, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = apiKey ? `${API_BASE}/api-keys/${apiKey.key}` : `${API_BASE}/api-keys`;
      const method = apiKey ? 'PUT' : 'POST';

      const body = apiKey 
        ? { value: formData.value || undefined, description: formData.description }
        : { key: formData.key, value: formData.value, description: formData.description };

      const response = await authenticatedFetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(body)
      }, navigate);

      const data = await response.json();

      if (data.success) {
        onSaved();
        onOpenChange(false);
      } else {
        throw new Error(data.message || 'Failed to save API key');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {apiKey ? 'Edit API Key' : 'Add API Key'}
          </DialogTitle>
          <DialogDescription>
            {apiKey ? 'Update the API key configuration' : 'Add a new API key to the system'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Key Name</label>
            <Input
              value={formData.key}
              onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
              placeholder="api_key_name"
              disabled={!!apiKey}
              required={!apiKey}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {apiKey ? 'New Value (leave empty to keep current)' : 'Value'}
            </label>
            <Input
              type="password"
              value={formData.value}
              onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
              placeholder={apiKey ? '••••••••' : 'Enter API key value'}
              required={!apiKey}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this API key"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {apiKey ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


// Main Component
const SystemSettings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  
  // Settings state
  const [settings, setSettings] = useState([]);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState(null);
  
  // Features state
  const [features, setFeatures] = useState([]);
  const [featuresLoading, setFeaturesLoading] = useState(true);
  
  // Maintenance state
  const [maintenanceStatus, setMaintenanceStatus] = useState(null);
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);
  
  // API Keys state
  const [apiKeys, setApiKeys] = useState([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(true);
  const [revealedKeys, setRevealedKeys] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);
  
  // Modal state
  const [settingModalOpen, setSettingModalOpen] = useState(false);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState(null);
  const [selectedApiKey, setSelectedApiKey] = useState(null);
  
  const [refreshing, setRefreshing] = useState(false);
  const [togglingFeature, setTogglingFeature] = useState(null);

  // Fetch settings by category
  const fetchSettings = useCallback(async (category = 'general') => {
    try {
      setSettingsLoading(true);
      setSettingsError(null);
      
      const params = new URLSearchParams({
        category,
        limit: '100',
        sortBy: 'key',
        sortOrder: 'asc'
      });
      
      const response = await authenticatedFetch(`${API_BASE}?${params}`, {
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.data.settings);
      } else {
        throw new Error(data.message || 'Failed to fetch settings');
      }
    } catch (err) {
      setSettingsError(err.message);
    } finally {
      setSettingsLoading(false);
    }
  }, [navigate]);

  // Fetch features
  const fetchFeatures = useCallback(async () => {
    try {
      setFeaturesLoading(true);
      
      const response = await authenticatedFetch(`${API_BASE}/features/list`, {
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        setFeatures(data.data.features);
      }
    } catch (err) {
      console.error('Error fetching features:', err);
    } finally {
      setFeaturesLoading(false);
    }
  }, [navigate]);

  // Fetch maintenance status
  const fetchMaintenanceStatus = useCallback(async () => {
    try {
      setMaintenanceLoading(true);
      
      const response = await authenticatedFetch(`${API_BASE}/maintenance/status`, {
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        setMaintenanceStatus(data.data);
      }
    } catch (err) {
      console.error('Error fetching maintenance status:', err);
    } finally {
      setMaintenanceLoading(false);
    }
  }, [navigate]);

  // Fetch API keys
  const fetchApiKeys = useCallback(async () => {
    try {
      setApiKeysLoading(true);
      
      const response = await authenticatedFetch(`${API_BASE}/api-keys/list`, {
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        setApiKeys(data.data.apiKeys);
      }
    } catch (err) {
      console.error('Error fetching API keys:', err);
    } finally {
      setApiKeysLoading(false);
    }
  }, [navigate]);

  // Initial load
  useEffect(() => {
    fetchSettings('general');
    fetchFeatures();
    fetchMaintenanceStatus();
    fetchApiKeys();
  }, []);

  // Fetch settings when tab changes
  useEffect(() => {
    if (activeTab === 'general' || activeTab === 'security' || activeTab === 'notifications') {
      fetchSettings(activeTab);
    }
  }, [activeTab, fetchSettings]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchSettings(activeTab),
      fetchFeatures(),
      fetchMaintenanceStatus(),
      fetchApiKeys()
    ]);
    setRefreshing(false);
  };

  // Toggle feature
  const handleToggleFeature = async (featureKey) => {
    const feature = features.find(f => f.key === featureKey);
    if (!feature) return;
    
    setTogglingFeature(featureKey);
    
    try {
      const cleanKey = featureKey.replace('feature_', '');
      const response = await authenticatedFetch(`${API_BASE}/features/${cleanKey}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ enabled: !feature.value })
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        fetchFeatures();
      }
    } catch (err) {
      console.error('Error toggling feature:', err);
    } finally {
      setTogglingFeature(null);
    }
  };

  // Delete setting
  const handleDeleteSetting = async (key) => {
    if (!window.confirm(`Are you sure you want to delete the setting "${key}"?`)) return;
    
    try {
      const response = await authenticatedFetch(`${API_BASE}/${key}`, {
        method: 'DELETE',
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        fetchSettings(activeTab);
      }
    } catch (err) {
      console.error('Error deleting setting:', err);
    }
  };

  // Reveal API key
  const handleRevealApiKey = async (key) => {
    if (revealedKeys[key]) {
      setRevealedKeys(prev => ({ ...prev, [key]: null }));
      return;
    }
    
    try {
      const response = await authenticatedFetch(`${API_BASE}/api-keys/${key}/reveal`, {
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        setRevealedKeys(prev => ({ ...prev, [key]: data.data.value }));
      }
    } catch (err) {
      console.error('Error revealing API key:', err);
    }
  };

  // Copy API key
  const handleCopyApiKey = async (key) => {
    const value = revealedKeys[key];
    if (!value) {
      // First reveal, then copy
      try {
        const response = await authenticatedFetch(`${API_BASE}/api-keys/${key}/reveal`, {
          headers: getHeaders()
        }, navigate);
        
        const data = await response.json();
        
        if (data.success) {
          await navigator.clipboard.writeText(data.data.value);
          setCopiedKey(key);
          setTimeout(() => setCopiedKey(null), 2000);
        }
      } catch (err) {
        console.error('Error copying API key:', err);
      }
    } else {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // Delete API key
  const handleDeleteApiKey = async (key) => {
    if (!window.confirm(`Are you sure you want to delete the API key "${key}"?`)) return;
    
    try {
      const response = await authenticatedFetch(`${API_BASE}/${key}`, {
        method: 'DELETE',
        headers: getHeaders()
      }, navigate);
      
      const data = await response.json();
      
      if (data.success) {
        fetchApiKeys();
      }
    } catch (err) {
      console.error('Error deleting API key:', err);
    }
  };

  const formatValue = (setting) => {
    if (setting.type === 'boolean') {
      return setting.value ? 'True' : 'False';
    }
    if (setting.type === 'json') {
      return JSON.stringify(setting.value);
    }
    return String(setting.displayValue ?? setting.value ?? '');
  };


  // Render settings list
  const renderSettings = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg capitalize">{activeTab} Settings</CardTitle>
          <CardDescription>Manage {activeTab} configuration settings</CardDescription>
        </div>
        <Button onClick={() => { setSelectedSetting(null); setSettingModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Setting
        </Button>
      </CardHeader>
      <CardContent>
        {settingsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : settingsError ? (
          <div className="text-center py-8 text-destructive">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>{settingsError}</p>
          </div>
        ) : settings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No settings found in this category</p>
          </div>
        ) : (
          <div className="divide-y">
            {settings.map(setting => (
              <div key={setting._id} className="flex items-center justify-between py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium font-mono text-sm">{setting.key}</p>
                    <Badge variant="outline" className="text-xs">{setting.type}</Badge>
                    {setting.isPublic && <Badge variant="secondary" className="text-xs">Public</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{setting.description || 'No description'}</p>
                  <p className="text-sm font-mono bg-muted px-2 py-1 rounded mt-1 truncate max-w-md">
                    {formatValue(setting)}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => { setSelectedSetting(setting); setSettingModalOpen(true); }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteSetting(setting.key)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render features
  const renderFeatures = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Feature Toggles</CardTitle>
        <CardDescription>Enable or disable application features</CardDescription>
      </CardHeader>
      <CardContent>
        {featuresLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : features.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ToggleLeft className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No feature toggles configured</p>
            <p className="text-sm mt-1">Feature toggles will appear here when created</p>
          </div>
        ) : (
          <div className="divide-y">
            {features.map(feature => {
              const featureName = feature.key.replace('feature_', '').replace(/_/g, ' ');
              return (
                <div key={feature._id} className="flex items-center justify-between py-4">
                  <div className="flex-1">
                    <p className="font-medium capitalize">{featureName}</p>
                    <p className="text-sm text-muted-foreground">{feature.description || 'No description'}</p>
                  </div>
                  <Button
                    variant={feature.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleToggleFeature(feature.key)}
                    disabled={togglingFeature === feature.key}
                  >
                    {togglingFeature === feature.key ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : feature.value ? (
                      <><ToggleRight className="h-4 w-4 mr-2" /> Enabled</>
                    ) : (
                      <><ToggleLeft className="h-4 w-4 mr-2" /> Disabled</>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render maintenance mode
  const renderMaintenance = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className={cn('h-5 w-5', maintenanceStatus?.enabled ? 'text-yellow-500' : 'text-muted-foreground')} />
          Maintenance Mode
        </CardTitle>
        <CardDescription>Control system maintenance mode for non-admin users</CardDescription>
      </CardHeader>
      <CardContent>
        {maintenanceLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className={cn(
              'p-4 rounded-lg border-2',
              maintenanceStatus?.enabled 
                ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' 
                : 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium flex items-center gap-2">
                    {maintenanceStatus?.enabled ? (
                      <><Wrench className="h-4 w-4 text-yellow-600" /> Maintenance Mode Active</>
                    ) : (
                      <><Check className="h-4 w-4 text-green-600" /> System Operational</>
                    )}
                  </p>
                  {maintenanceStatus?.enabled && (
                    <p className="text-sm text-muted-foreground mt-1">{maintenanceStatus.message}</p>
                  )}
                  {maintenanceStatus?.enabled && maintenanceStatus?.estimatedEndTime && (
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Estimated end: {new Date(maintenanceStatus.estimatedEndTime).toLocaleString()}
                    </p>
                  )}
                </div>
                <Button
                  variant={maintenanceStatus?.enabled ? 'destructive' : 'default'}
                  onClick={() => setMaintenanceModalOpen(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>
            </div>
            
            {maintenanceStatus?.allowedIPs?.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Allowed IPs during maintenance:</p>
                <div className="flex flex-wrap gap-2">
                  {maintenanceStatus.allowedIPs.map((ip, i) => (
                    <Badge key={i} variant="outline">{ip}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );


  // Render API keys
  const renderApiKeys = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">API Keys</CardTitle>
          <CardDescription>Manage API keys and credentials</CardDescription>
        </div>
        <Button onClick={() => { setSelectedApiKey(null); setApiKeyModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add API Key
        </Button>
      </CardHeader>
      <CardContent>
        {apiKeysLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No API keys configured</p>
            <p className="text-sm mt-1">Click "Add API Key" to create one</p>
          </div>
        ) : (
          <div className="divide-y">
            {apiKeys.map(apiKey => (
              <div key={apiKey._id} className="flex items-center justify-between py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium font-mono text-sm">{apiKey.key}</p>
                  <p className="text-sm text-muted-foreground">{apiKey.description || 'No description'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                      {revealedKeys[apiKey.key] || apiKey.displayValue || '••••••••'}
                    </code>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRevealApiKey(apiKey.key)}
                    title={revealedKeys[apiKey.key] ? 'Hide' : 'Reveal'}
                  >
                    {revealedKeys[apiKey.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleCopyApiKey(apiKey.key)}
                    title="Copy to clipboard"
                  >
                    {copiedKey === apiKey.key ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => { setSelectedApiKey(apiKey); setApiKeyModalOpen(true); }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteApiKey(apiKey.key)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'features', label: 'Features', icon: ToggleLeft },
    { id: 'maintenance', label: 'Maintenance', icon: AlertTriangle },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: AlertCircle }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wrench className="h-6 w-6" />
            System Settings
          </h1>
          <p className="text-muted-foreground">
            Configure system-wide settings, features, and maintenance mode
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 whitespace-nowrap",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'general' && renderSettings()}
        {activeTab === 'features' && renderFeatures()}
        {activeTab === 'maintenance' && renderMaintenance()}
        {activeTab === 'api' && renderApiKeys()}
        {activeTab === 'security' && renderSettings()}
        {activeTab === 'notifications' && renderSettings()}
      </div>

      {/* Modals */}
      <SettingModal
        open={settingModalOpen}
        onOpenChange={setSettingModalOpen}
        setting={selectedSetting}
        onSaved={() => fetchSettings(activeTab)}
      />

      <MaintenanceModeModal
        open={maintenanceModalOpen}
        onOpenChange={setMaintenanceModalOpen}
        currentStatus={maintenanceStatus}
        onSaved={fetchMaintenanceStatus}
      />

      <ApiKeyModal
        open={apiKeyModalOpen}
        onOpenChange={setApiKeyModalOpen}
        apiKey={selectedApiKey}
        onSaved={fetchApiKeys}
      />
    </div>
  );
};

export default SystemSettings;
