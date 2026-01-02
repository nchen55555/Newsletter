"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Link } from "lucide-react";

interface AddFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldType: string; // Can be any field name like 'linkedin_url', 'resume_url', 'personal_website', etc.
  fieldTitle?: string; // Display name like 'LinkedIn URL', 'Resume', 'Website', etc. If not provided, user can input their own
  allowFile?: boolean; // Whether to allow file uploads for this field
  userId: number; // User ID for file uploads
  currentCustomLinks?: string; // Current custom_links JSON string
  onSave: (field: string, value: string | Record<string, string>) => Promise<void>;
}

export function AddFileDialog({ open, onOpenChange, fieldType, fieldTitle, allowFile = false, userId, currentCustomLinks, onSave }: AddFileDialogProps) {
  const [inputType, setInputType] = useState<'url' | 'file'>('url');
  const [urlValue, setUrlValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const needsCustomTitle = !fieldTitle;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!urlValue && !selectedFile) return;
    if (needsCustomTitle && !customTitle.trim()) return;
    
    setLoading(true);
    try {
      if (inputType === 'url' && urlValue) {
        // Check if this is a standard field or custom field
        const standardFields = ['linkedin_url', 'resume_url', 'personal_website', 'github_url'];
        
        if (standardFields.includes(fieldType)) {
          // Handle standard fields normally
          await onSave(fieldType, urlValue);
        } else {
          // Handle custom fields - merge with existing custom_links
          const existingLinks = currentCustomLinks ? JSON.parse(currentCustomLinks) : {};
          const updatedLinks = { ...existingLinks, [customTitle.trim()]: urlValue };
          await onSave('custom_links', JSON.stringify(updatedLinks));
        }
      } else if (inputType === 'file' && selectedFile) {
        // For file uploads, call the API directly with FormData
        const formData = new FormData();
        formData.append('id', userId.toString());
        
        if (fieldType.includes('resume')) {
          formData.append('resume_file', selectedFile);
        } else {
          formData.append('file', selectedFile);
        }
        
        const response = await fetch('/api/post_profile', {
          method: 'PATCH',
          body: formData,
        });
        
        if (response.ok) {
          // The onSave callback will handle the refresh
          await onSave('file_upload', 'success');
        } else {
          throw new Error('Failed to upload file');
        }
      }
      
      // Reset form
      setUrlValue('');
      setSelectedFile(null);
      setCustomTitle('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUrlValue('');
    setSelectedFile(null);
    setCustomTitle('');
    setInputType('url');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add {fieldTitle || 'Link/File'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Custom title input if no fieldTitle provided */}
          {needsCustomTitle && (
            <div className="space-y-2">
              <Label htmlFor="custom-title">Display Name</Label>
              <Input
                id="custom-title"
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g., Portfolio, GitHub, Company Website"
                className="w-full"
              />
            </div>
          )}

          {/* Input type selection */}
          <div className="flex gap-2">
            <Button
              variant={inputType === 'url' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInputType('url')}
              className="flex items-center gap-2"
            >
              <Link className="w-4 h-4" />
              URL
            </Button>
            {allowFile && (
              <Button
                variant={inputType === 'file' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInputType('file')}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                File
              </Button>
            )}
          </div>

          {/* URL input */}
          {inputType === 'url' && (
            <div className="space-y-2">
              <Label htmlFor="url-input">
                {fieldTitle ? `${fieldTitle} URL` : `${customTitle || 'Link'} URL`}
              </Label>
              <Input
                id="url-input"
                type="url"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="https://example.com"
                className="w-full"
              />
            </div>
          )}

          {/* File input */}
          {inputType === 'file' && allowFile && (
            <div className="space-y-2">
              <Label htmlFor="file-input">Upload {fieldTitle || customTitle || 'File'}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file-input"
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx"
                  className="w-full"
                />
              </div>
              {selectedFile && (
                <p className="text-sm text-gray-600">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || (!urlValue && !selectedFile) || (needsCustomTitle && !customTitle.trim())}
          >
            {loading ? 'Adding...' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}