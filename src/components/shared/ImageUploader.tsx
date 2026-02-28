import { useCallback, useRef, useState } from 'react'
import { Upload, X, Loader2, AlertCircle, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import apiClient from '@/api/client'
import type { ApiResponse } from '@/types'
import { toast } from 'sonner'

interface UploadingItem {
  id: string
  localUrl: string
  progress: number
  status: 'uploading' | 'error'
  errorMsg?: string
}

interface ImageUploaderProps {
  /** Already-uploaded image URLs (controlled) */
  value: string[]
  onChange: (urls: string[]) => void
  folder?: 'products' | 'categories' | 'general'
  maxImages?: number
  disabled?: boolean
}

/**
 * Optimistic Image Uploader
 * - Drag & drop or click to select
 * - Instant local preview before upload
 * - Per-image upload progress bar
 * - Cloudinary-backed via POST /api/upload
 * - First image is tagged as "Main"
 */
export function ImageUploader({
  value,
  onChange,
  folder = 'products',
  maxImages = 6,
  disabled = false,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState<UploadingItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const totalCount = value.length + uploading.filter((u) => u.status === 'uploading').length
  const canAdd = !disabled && totalCount < maxImages

  /* ── Upload a single file ── */
  const uploadFile = useCallback(
    async (file: File) => {
      const id = crypto.randomUUID()
      const localUrl = URL.createObjectURL(file)

      setUploading((prev) => [...prev, { id, localUrl, progress: 0, status: 'uploading' }])

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', folder)

        const res = await apiClient.post<ApiResponse<{ url: string; public_id: string }>>(
          '/upload',
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (evt) => {
              const pct = Math.round(((evt.loaded ?? 0) / (evt.total ?? 1)) * 100)
              setUploading((prev) =>
                prev.map((u) => (u.id === id ? { ...u, progress: pct } : u)),
              )
            },
          },
        )

        const remoteUrl = res.data.data.url
        // Remove from uploading, push to done list
        setUploading((prev) => prev.filter((u) => u.id !== id))
        URL.revokeObjectURL(localUrl)
        onChange([...value, remoteUrl])
      } catch {
        setUploading((prev) =>
          prev.map((u) =>
            u.id === id ? { ...u, status: 'error', errorMsg: 'Upload failed', progress: 0 } : u,
          ),
        )
        toast.error(`Failed to upload ${file.name}`)
      }
    },
    [folder, value, onChange],
  )

  /* ── Process dropped/selected files ── */
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || !canAdd) return
      const remaining = maxImages - totalCount
      const accepted = Array.from(files)
        .filter((f) => f.type.startsWith('image/'))
        .slice(0, remaining)

      if (accepted.length === 0) {
        toast.error('Only image files are supported (JPG, PNG, WebP)')
        return
      }
      accepted.forEach(uploadFile)
    },
    [canAdd, maxImages, totalCount, uploadFile],
  )

  /* ── Remove an already-uploaded image ── */
  const removeExisting = (url: string) => {
    onChange(value.filter((u) => u !== url))
  }

  /* ── Dismiss an errored upload item ── */
  const dismissError = (id: string) => {
    const item = uploading.find((u) => u.id === id)
    if (item) URL.revokeObjectURL(item.localUrl)
    setUploading((prev) => prev.filter((u) => u.id !== id))
  }

  /* ── Retry a failed upload ── */
  const retryUpload = (id: string) => {
    dismissError(id)
    // No-op for now; user can re-add the file
    toast.info('Please re-add the image to retry')
  }

  return (
    <div className="space-y-3">
      {/* ── Drop Zone ── */}
      {canAdd && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload images"
          className={cn(
            'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer',
            'transition-all duration-200 select-none outline-none',
            'focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
            isDragging
              ? 'border-indigo-400 bg-indigo-50 scale-[1.01] shadow-lg shadow-indigo-100'
              : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/70',
          )}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragEnter={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            handleFiles(e.dataTransfer.files)
          }}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        >
          <div
            className={cn(
              'flex flex-col items-center gap-2 transition-transform',
              isDragging && 'scale-105',
            )}
          >
            <div
              className={cn(
                'rounded-full p-3 transition-colors',
                isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400',
              )}
            >
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">
                {isDragging ? 'Drop to upload' : 'Drag & drop or click to browse'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                JPG, PNG, WebP · Max 5 MB · Up to {maxImages} images
                {value.length > 0 && ` · ${maxImages - totalCount} slot${maxImages - totalCount !== 1 ? 's' : ''} remaining`}
              </p>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>
      )}

      {/* ── Preview Grid: uploaded + in-flight ── */}
      {(value.length > 0 || uploading.length > 0) && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Existing / done images */}
          {value.map((url, i) => (
            <div
              key={url}
              className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 group shadow-sm ring-1 ring-slate-200"
            >
              <img
                src={url}
                alt={`Product image ${i + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />

              {/* Main badge */}
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md shadow">
                  Main
                </span>
              )}

              {/* Drag handle hint */}
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-60 transition-opacity">
                <GripVertical className="h-4 w-4 text-white drop-shadow" />
              </div>

              {/* Remove */}
              {!disabled && (
                <button
                  type="button"
                  title="Remove image"
                  className="absolute top-1.5 right-1.5 bg-black/50 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-150 scale-90 hover:scale-100"
                  onClick={() => removeExisting(url)}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          {/* In-progress uploads */}
          {uploading.map((item) => (
            <div
              key={item.id}
              className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 ring-1 ring-slate-200 shadow-sm"
            >
              {/* Blurred thumbnail preview */}
              <img
                src={item.localUrl}
                alt="Uploading…"
                className="w-full h-full object-cover blur-[1px] brightness-75"
              />

              {item.status === 'uploading' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                  {/* Progress bar */}
                  <div className="w-3/4">
                    <div className="w-full bg-white/30 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-white h-full rounded-full transition-all duration-200 ease-out"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <p className="text-white text-[10px] text-center mt-1 font-medium">
                      {item.progress}%
                    </p>
                  </div>
                </div>
              )}

              {item.status === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-red-600/75">
                  <AlertCircle className="h-5 w-5 text-white" />
                  <p className="text-white text-[10px] text-center font-medium px-2">
                    {item.errorMsg}
                  </p>
                  <div className="flex gap-1.5 mt-1">
                    <button
                      type="button"
                      className="text-[10px] bg-white/20 hover:bg-white/30 text-white rounded px-2 py-0.5 font-medium"
                      onClick={() => retryUpload(item.id)}
                    >
                      Retry
                    </button>
                    <button
                      type="button"
                      className="text-[10px] bg-white/20 hover:bg-white/30 text-white rounded px-2 py-0.5 font-medium"
                      onClick={() => dismissError(item.id)}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Soft hint when at limit */}
      {!canAdd && !disabled && (
        <p className="text-xs text-slate-400 text-center">
          Maximum of {maxImages} images reached. Remove one to add another.
        </p>
      )}
    </div>
  )
}
