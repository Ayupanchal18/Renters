import React, { useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from '../ui/use-toast';
import { 
  X, FileText, Image as ImageIcon, Link2, 
  Trash2, RefreshCw, Edit, Calendar, User, 
  HardDrive, AlertTriangle, ExternalLink 
} from 'lucide-react';
import { authenticatedFetch, getHeaders } from '../../lib/api';
import MediaImageEditor from './MediaImageEditor';

export default function MediaDetailPanel({ asset, open, onClose, onDeleteSuccess, onReplaceSuccess }) {
  const fileInputRef = useRef(null);
  const [replacing, setReplacing] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  if (!open || !asset) return null;

  const isImage = asset.mimeType?.startsWith('image/');
  
  const copyUrl = () => {
    navigator.clipboard.writeText(asset.cdnUrl);
    toast({
      title: "URL Copied",
      description: "Direct link has been copied to your clipboard.",
    });
  };

  const handleFileReplace = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReplacing(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('authToken');
      const headers = {};
      if (token) {
        headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      }
      const userId = localStorage.getItem("userId");
      if (userId) {
        headers['x-user-id'] = userId;
      }

      const response = await fetch(`/api/admin/media/${asset._id}/replace`, {
        method: 'PATCH',
        headers,
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Asset Replaced",
          description: "The file was successfully replaced across all occurrences."
        });
        if (onReplaceSuccess) onReplaceSuccess(data.data);
      } else {
        throw new Error(data.message || "Failed to replace file");
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Replacement Failed",
        description: err.message || "An error occurred during replacement.",
        variant: "destructive"
      });
    } finally {
      setReplacing(false);
    }
  };

  const handleDelete = async (force = false) => {
    // Linked assets warning
    if (asset.usedIn?.length > 0 && !force) {
      const confirmForce = window.confirm(
        `Warning: This asset is linked to ${asset.usedIn.length} other items (e.g. properties/content). Deleting it will result in broken links. Do you want to force delete it?`
      );
      if (!confirmForce) return;
      return handleDelete(true);
    }

    if (!force && !window.confirm("Are you sure you want to delete this asset?")) {
      return;
    }

    try {
      const response = await authenticatedFetch(
        `/api/admin/media/${asset._id}${force ? '?force=true' : ''}`,
        { method: 'DELETE', headers: getHeaders() }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Asset Deleted",
          description: data.message || "Asset removed from library."
        });
        if (onDeleteSuccess) onDeleteSuccess(asset._id);
        onClose();
      } else {
        throw new Error(data.message || "Failed to delete asset");
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Delete Failed",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className={cn(
        'fixed right-0 top-0 h-full z-50 w-[480px] bg-background border-l border-border',
        'flex flex-col shadow-2xl transition-transform duration-300',
        open ? 'translate-x-0' : 'translate-x-full'
      )}>
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex-1 min-w-0">
            <h2 className="text-md font-bold text-foreground truncate">Asset Details</h2>
            <p className="text-xs text-muted-foreground truncate">{asset.originalName || asset.filename}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground shrink-0 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Visual Preview */}
          <div className="rounded-xl border bg-muted/30 aspect-video flex items-center justify-center overflow-hidden relative group">
            {isImage ? (
              <img
                src={asset.cdnUrl}
                alt={asset.originalName}
                className="w-full h-full object-contain"
              />
            ) : (
              <FileText className="h-16 w-16 text-muted-foreground opacity-60" />
            )}

            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2">
              <Button size="sm" variant="secondary" onClick={copyUrl}>
                <Link2 className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <a href={asset.cdnUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="secondary">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Original
                </Button>
              </a>
            </div>
          </div>

          {/* Module / Tag Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="capitalize text-xs py-1">
              Module: {asset.module || 'misc'}
            </Badge>
            <Badge variant={asset.isOrphaned ? "secondary" : "default"} className="text-xs py-1">
              {asset.isOrphaned ? 'Orphaned (Unlinked)' : 'In Use'}
            </Badge>
            <Badge variant="outline" className="text-xs py-1">
              {asset.mimeType}
            </Badge>
          </div>

          {/* Metadata Section */}
          <div className="rounded-xl border p-4 bg-card space-y-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">File Metadata</h3>
            
            <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-xs">
              <div className="flex items-center gap-2">
                <HardDrive className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-muted-foreground">Size</p>
                  <p className="font-semibold">{(asset.sizeBytes / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>

              {isImage && asset.dimensions && (
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-muted-foreground">Dimensions</p>
                    <p className="font-semibold">{asset.dimensions.width} × {asset.dimensions.height} px</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-muted-foreground">Uploaded At</p>
                  <p className="font-semibold">{new Date(asset.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>

              {asset.uploadedBy && (
                <div className="flex items-center gap-2 col-span-2 border-t pt-3">
                  <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-muted-foreground">Uploaded By</p>
                    <p className="font-semibold">{asset.uploadedBy.name} ({asset.uploadedBy.role})</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Links / Usage Area */}
          <div className="rounded-xl border p-4 bg-card space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Used In ({asset.usedIn?.length || 0})</h3>
            
            {asset.usedIn?.length === 0 ? (
              <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                This asset is currently orphaned. It can be safely deleted.
              </p>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {asset.usedIn.map((lnk, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-muted/30 p-2 rounded text-xs">
                    <span className="font-medium capitalize text-muted-foreground">{lnk.resourceType}</span>
                    <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[150px]">{lnk.resourceId}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t p-5 bg-muted/20 flex flex-col gap-2">
          {isImage && (
            <Button className="w-full" variant="outline" onClick={() => setEditorOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Image (Canvas)
            </Button>
          )}

          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileReplace}
              className="hidden"
              accept={asset.mimeType}
            />
            <Button
              className="flex-1"
              variant="outline"
              disabled={replacing}
              onClick={() => fileInputRef.current?.click()}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", replacing && "animate-spin")} />
              Replace File
            </Button>
            <Button
              className="flex-1 hover:bg-destructive/10 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
              variant="outline"
              onClick={() => handleDelete()}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Asset
            </Button>
          </div>
        </div>
      </div>

      {/* Image Editor Modal */}
      {editorOpen && (
        <MediaImageEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          asset={asset}
          onSaveComplete={(updatedAsset) => {
            if (onReplaceSuccess) onReplaceSuccess(updatedAsset);
          }}
        />
      )}
    </>
  );
}
