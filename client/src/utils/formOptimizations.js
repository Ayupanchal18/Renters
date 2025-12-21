import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useDebouncedCallback } from './debounce';

/**
 * Performance optimizations for form handling
 * Validates: Requirements from design document performance considerations
 */

/**
 * Hook for optimized form field handling with debounced validation
 * @param {Object} initialValues - Initial form values
 * @param {Function} onValidate - Validation function
 * @param {number} validationDelay - Debounce delay for validation
 * @returns {Object} - Form utilities
 */
export function useOptimizedForm(initialValues = {}, onValidate = null, validationDelay = 300) {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isValidating, setIsValidating] = useState(false);

    // Debounced validation to prevent excessive validation calls
    const debouncedValidate = useDebouncedCallback(
        async (fieldName, value, allValues) => {
            if (!onValidate) return;

            setIsValidating(true);
            try {
                const fieldErrors = await onValidate(fieldName, value, allValues);
                setErrors(prev => ({
                    ...prev,
                    [fieldName]: fieldErrors
                }));
            } catch (error) {
                console.error('Validation error:', error);
            } finally {
                setIsValidating(false);
            }
        },
        validationDelay,
        [onValidate]
    );

    // Optimized field change handler
    const handleFieldChange = useCallback((fieldName, value) => {
        setValues(prev => ({
            ...prev,
            [fieldName]: value
        }));

        // Mark field as touched
        setTouched(prev => ({
            ...prev,
            [fieldName]: true
        }));

        // Trigger debounced validation
        if (onValidate && touched[fieldName]) {
            debouncedValidate(fieldName, value, { ...values, [fieldName]: value });
        }
    }, [values, touched, onValidate, debouncedValidate]);

    // Optimized blur handler
    const handleFieldBlur = useCallback((fieldName) => {
        setTouched(prev => ({
            ...prev,
            [fieldName]: true
        }));

        // Validate immediately on blur
        if (onValidate) {
            debouncedValidate(fieldName, values[fieldName], values);
        }
    }, [values, onValidate, debouncedValidate]);

    // Reset form
    const resetForm = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
        setIsValidating(false);
    }, [initialValues]);

    // Get field props for easy integration
    const getFieldProps = useCallback((fieldName) => ({
        value: values[fieldName] || '',
        onChange: (e) => handleFieldChange(fieldName, e.target.value),
        onBlur: () => handleFieldBlur(fieldName),
        error: touched[fieldName] ? errors[fieldName] : null,
        touched: touched[fieldName] || false
    }), [values, errors, touched, handleFieldChange, handleFieldBlur]);

    return {
        values,
        errors,
        touched,
        isValidating,
        handleFieldChange,
        handleFieldBlur,
        resetForm,
        getFieldProps,
        isValid: Object.keys(errors).length === 0,
        isDirty: Object.keys(touched).length > 0
    };
}

/**
 * Hook for optimized select/dropdown handling
 * @param {Array} options - Select options
 * @param {Function} onFilter - Filter function
 * @returns {Object} - Select utilities
 */
export function useOptimizedSelect(options = [], onFilter = null) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    // Memoize filtered options to prevent recalculation
    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;

        if (onFilter) {
            return onFilter(options, searchTerm);
        }

        // Default filtering by label/value
        return options.filter(option => {
            const searchValue = typeof option === 'string' ? option : (option.label || option.value || '');
            return searchValue.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [options, searchTerm, onFilter]);

    // Debounced search to prevent excessive filtering
    const debouncedSetSearchTerm = useDebouncedCallback(
        (term) => setSearchTerm(term),
        200,
        []
    );

    const handleSearchChange = useCallback((e) => {
        debouncedSetSearchTerm(e.target.value);
    }, [debouncedSetSearchTerm]);

    const handleOpen = useCallback(() => setIsOpen(true), []);
    const handleClose = useCallback(() => {
        setIsOpen(false);
        setSearchTerm('');
    }, []);

    return {
        searchTerm,
        filteredOptions,
        isOpen,
        handleSearchChange,
        handleOpen,
        handleClose,
        setSearchTerm: debouncedSetSearchTerm
    };
}

/**
 * Hook for optimized checkbox/radio group handling
 * @param {Array} initialSelected - Initially selected values
 * @returns {Object} - Checkbox group utilities
 */
export function useOptimizedCheckboxGroup(initialSelected = []) {
    const [selected, setSelected] = useState(new Set(initialSelected));

    const handleToggle = useCallback((value) => {
        setSelected(prev => {
            const newSet = new Set(prev);
            if (newSet.has(value)) {
                newSet.delete(value);
            } else {
                newSet.add(value);
            }
            return newSet;
        });
    }, []);

    const handleSelectAll = useCallback((values) => {
        setSelected(new Set(values));
    }, []);

    const handleDeselectAll = useCallback(() => {
        setSelected(new Set());
    }, []);

    const isSelected = useCallback((value) => {
        return selected.has(value);
    }, [selected]);

    const selectedArray = useMemo(() => Array.from(selected), [selected]);

    return {
        selected: selectedArray,
        handleToggle,
        handleSelectAll,
        handleDeselectAll,
        isSelected,
        selectedCount: selected.size
    };
}

/**
 * Hook for optimized file upload handling
 * @param {Object} options - Upload options
 * @returns {Object} - File upload utilities
 */
export function useOptimizedFileUpload(options = {}) {
    const {
        maxFiles = 5,
        maxSize = 5 * 1024 * 1024, // 5MB
        acceptedTypes = ['image/*'],
        onUpload = null
    } = options;

    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState({});
    const [errors, setErrors] = useState({});

    const fileInputRef = useRef(null);

    const validateFile = useCallback((file) => {
        const errors = [];

        if (file.size > maxSize) {
            errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
        }

        if (acceptedTypes.length > 0) {
            const isValidType = acceptedTypes.some(type => {
                if (type.endsWith('/*')) {
                    return file.type.startsWith(type.slice(0, -1));
                }
                return file.type === type;
            });

            if (!isValidType) {
                errors.push(`File type not supported. Accepted types: ${acceptedTypes.join(', ')}`);
            }
        }

        return errors;
    }, [maxSize, acceptedTypes]);

    const handleFileSelect = useCallback((selectedFiles) => {
        const fileArray = Array.from(selectedFiles);

        if (files.length + fileArray.length > maxFiles) {
            setErrors(prev => ({
                ...prev,
                general: `Maximum ${maxFiles} files allowed`
            }));
            return;
        }

        const validFiles = [];
        const fileErrors = {};

        fileArray.forEach((file, index) => {
            const validationErrors = validateFile(file);
            if (validationErrors.length > 0) {
                fileErrors[`file_${index}`] = validationErrors;
            } else {
                validFiles.push({
                    file,
                    id: `${Date.now()}_${index}`,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
                });
            }
        });

        if (Object.keys(fileErrors).length > 0) {
            setErrors(prev => ({ ...prev, ...fileErrors }));
        }

        if (validFiles.length > 0) {
            setFiles(prev => [...prev, ...validFiles]);
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.general;
                return newErrors;
            });
        }
    }, [files.length, maxFiles, validateFile]);

    const handleFileRemove = useCallback((fileId) => {
        setFiles(prev => {
            const updated = prev.filter(f => f.id !== fileId);
            // Cleanup preview URLs
            const removedFile = prev.find(f => f.id === fileId);
            if (removedFile?.preview) {
                URL.revokeObjectURL(removedFile.preview);
            }
            return updated;
        });

        setProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
        });
    }, []);

    const handleUpload = useCallback(async () => {
        if (!onUpload || files.length === 0) return;

        setUploading(true);
        setErrors({});

        try {
            for (const fileData of files) {
                setProgress(prev => ({ ...prev, [fileData.id]: 0 }));

                try {
                    await onUpload(fileData.file, (progressPercent) => {
                        setProgress(prev => ({ ...prev, [fileData.id]: progressPercent }));
                    });
                } catch (error) {
                    setErrors(prev => ({
                        ...prev,
                        [fileData.id]: error.message || 'Upload failed'
                    }));
                }
            }
        } finally {
            setUploading(false);
        }
    }, [files, onUpload]);

    const resetFiles = useCallback(() => {
        // Cleanup preview URLs
        files.forEach(file => {
            if (file.preview) {
                URL.revokeObjectURL(file.preview);
            }
        });

        setFiles([]);
        setProgress({});
        setErrors({});
        setUploading(false);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [files]);

    return {
        files,
        uploading,
        progress,
        errors,
        fileInputRef,
        handleFileSelect,
        handleFileRemove,
        handleUpload,
        resetFiles,
        canUpload: files.length > 0 && !uploading,
        totalSize: files.reduce((sum, file) => sum + file.size, 0)
    };
}

/**
 * Memoized form field component for better performance
 */
export const OptimizedFormField = React.memo(function OptimizedFormField({
    label,
    name,
    type = 'text',
    placeholder,
    value,
    onChange,
    onBlur,
    error,
    touched,
    disabled = false,
    required = false,
    className = '',
    ...props
}) {
    const handleChange = useCallback((e) => {
        onChange(e.target.value);
    }, [onChange]);

    const fieldId = useMemo(() => `field_${name}`, [name]);

    return (
        <div className={`space-y-2 ${className}`}>
            {label && (
                <label
                    htmlFor={fieldId}
                    className="block text-sm font-medium text-gray-700"
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <input
                id={fieldId}
                name={name}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                onBlur={onBlur}
                disabled={disabled}
                className={`
          w-full px-3 py-2 border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error && touched ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}
        `}
                {...props}
            />

            {error && touched && (
                <p className="text-sm text-red-600">{error}</p>
            )}
        </div>
    );
});