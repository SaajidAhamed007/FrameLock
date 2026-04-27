import { useState, useRef } from 'react'
import { Upload, FileVideo, X, CheckCircle2 } from 'lucide-react'

export function UploadBox() {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleFile = (file: File) => {
    setUploadedFile(file)
    setIsDone(false)
  }

  const handleCheck = () => {
    if (!uploadedFile) return
    setIsChecking(true)
    setTimeout(() => {
      setIsChecking(false)
      setIsDone(true)
    }, 2000)
  }

  const handleClear = () => {
    setUploadedFile(null)
    setIsDone(false)
    setIsChecking(false)
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        id="upload-drop-zone"
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploadedFile && inputRef.current?.click()}
        className="relative rounded-xl transition-all duration-200 cursor-pointer"
        style={{
          border: isDragging
            ? '2px dashed #6366F1'
            : uploadedFile
              ? '2px solid rgba(16,185,129,0.4)'
              : '2px dashed rgba(255,255,255,0.1)',
          backgroundColor: isDragging
            ? 'rgba(99,102,241,0.06)'
            : uploadedFile
              ? 'rgba(16,185,129,0.04)'
              : 'rgba(255,255,255,0.02)',
          boxShadow: isDragging ? '0 0 24px rgba(99,102,241,0.15)' : 'none',
          padding: '32px 24px',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          id="file-upload-input"
          accept=".mp4,.mov,.avi,.mkv,.webm"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {uploadedFile ? (
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(16,185,129,0.12)' }}
            >
              <FileVideo className="w-6 h-6" style={{ color: '#10B981' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: '#E4E4E7' }}>
                {uploadedFile.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#71717A' }}>
                {(uploadedFile.size / 1_000_000).toFixed(1)} MB • Ready to scan
              </p>
            </div>
            <button
              id="clear-upload-btn"
              onClick={(e) => { e.stopPropagation(); handleClear() }}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" style={{ color: '#71717A' }} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: isDragging ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
                transition: 'all 0.2s',
              }}
            >
              <Upload
                className="w-7 h-7 transition-transform duration-200"
                style={{
                  color: isDragging ? '#6366F1' : '#52525B',
                  transform: isDragging ? 'translateY(-2px)' : 'none',
                }}
              />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: '#E4E4E7' }}>
                {isDragging ? 'Drop to upload' : 'Drag & drop your video here'}
              </p>
              <p className="text-xs mt-1" style={{ color: '#52525B' }}>
                or click to browse • MP4, MOV, AVI, MKV, WebM
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action button */}
      {uploadedFile && (
        <button
          id="check-before-upload-btn"
          onClick={handleCheck}
          disabled={isChecking || isDone}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          style={{
            backgroundColor: isDone
              ? 'rgba(16,185,129,0.12)'
              : isChecking
                ? 'rgba(99,102,241,0.15)'
                : '#6366F1',
            color: isDone ? '#10B981' : isChecking ? '#818CF8' : 'white',
            border: isDone ? '1px solid rgba(16,185,129,0.3)' : 'none',
            cursor: isChecking || isDone ? 'default' : 'pointer',
            boxShadow: !isDone && !isChecking ? '0 0 20px rgba(99,102,241,0.3)' : 'none',
          }}
        >
          {isDone ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Scan Complete — 2 potential conflicts found
            </>
          ) : isChecking ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Scanning for conflicts…
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Run Pre-upload Check
            </>
          )}
        </button>
      )}
    </div>
  )
}
