import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { UploadCloud, FileText, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { toast } from '../ui/use-toast';
import { getToken } from '../../utils/auth';

const allowedTypes = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'text/csv'
];

export default function MediaUploadZone({ onUploadComplete, module = 'misc' }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  const compressImage = (file) => {
    return new Promise((resolve) => {
      // If not an image or smaller than 2MB, don't compress
      if (!file.type.startsWith('image/') || file.size <= 2 * 1024 * 1024) {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Limit maximum dimensions
          const MAX_WIDTH = 2048;
          const MAX_HEIGHT = 2048;
          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            if (width > height) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            } else {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const nameWithoutExtension = file.name.substring(0, file.name.lastIndexOf('.'));
            const compressedFile = new File([blob], `${nameWithoutExtension}_compressed.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          }, 'image/jpeg', 0.85); // 85% compression quality
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndAddFiles = (selectedFiles) => {
    const validFiles = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (allowedTypes.includes(file.type)) {
        validFiles.push(file);
      } else {
        toast({
          title: "Unsupported File Format",
          description: `${file.name} is not an allowed format. JPEG, PNG, GIF, WEBP, PDF, CSV only.`,
          variant: "destructive"
        });
      }
    }
    setFiles((prev) => [...prev, ...validFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndAddFiles(e.target.files);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress({});

    try {
      const token = getToken();
      const formData = new FormData();
      formData.append('module', module);

      // Compress images > 2MB and append to form data
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let processedFile = file;

        if (file.type.startsWith('image/') && file.size > 2 * 1024 * 1024) {
          processedFile = await compressImage(file);
        }

        formData.append('files', processedFile);
      }

      // XHR for upload progress monitoring
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/admin/media/upload');
      
      if (token) {
        xhr.setRequestHeader('Authorization', token.startsWith('Bearer ') ? token : `Bearer ${token}`);
      }
      
      const userId = localStorage.getItem("userId");
      if (userId) {
        xhr.setRequestHeader('x-user-id', userId);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress({ percent: percentComplete });
        }
      };

      xhr.onload = () => {
        setUploading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          toast({
            title: "Upload Successful",
            description: response.message || `${files.length} file(s) uploaded successfully.`,
          });
          setFiles([]);
          if (onUploadComplete) onUploadComplete(response.data);
        } else {
          const response = JSON.parse(xhr.responseText || '{}');
          toast({
            title: "Upload Failed",
            description: response.message || "Failed to upload files. Please try again.",
            variant: "destructive"
          });
        }
      };

      xhr.onerror = () => {
        setUploading(false);
        toast({
          title: "Upload Error",
          description: "A network error occurred during the upload.",
          variant: "destructive"
        });
      };

      xhr.send(formData);

    } catch (err) {
      console.error(err);
      setUploading(false);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center cursor-pointer transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.csv"
          onChange={handleChange}
          disabled={uploading}
        />
        <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
        <p className="font-medium text-sm mb-1">
          Drag & drop files here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground">
          Supports JPG, PNG, GIF, WEBP, PDF, CSV (Max 15MB per file)
        </p>
      </div>

      {files.length > 0 && (
        <div className="bg-card border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Files to Upload ({files.length})
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={uploading}
              onClick={() => setFiles([])}
              className="text-xs text-destructive hover:bg-destructive/10"
            >
              Clear All
            </Button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {files.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between p-2 bg-muted/40 rounded-lg text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {file.type.startsWith('image/') ? (
                    <ImageIcon className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <FileText className="h-4 w-4 text-emerald-500 shrink-0" />
                  )}
                  <span className="truncate font-medium pr-2">{file.name}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                    {file.size > 2 * 1024 * 1024 && file.type.startsWith('image/') && (
                      <span className="text-primary ml-1 font-semibold">(Will compress)</span>
                    )}
                  </span>
                </div>
                {!uploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {uploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-medium">
                <span>Uploading...</span>
                <span>{uploadProgress.percent || 0}%</span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${uploadProgress.percent || 0}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => setFiles([])}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={uploading || files.length === 0}
              onClick={uploadFiles}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Start Upload'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
