// Confirmation Modal Component
// Used for confirming sensitive actions like sending WhatsApp messages

import { useEffect, useCallback } from 'react'

export interface ConfirmationDetail {
  label: string
  value: string
}

export interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  icon?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger' | 'success'
  details?: ConfirmationDetail[]
  isLoading?: boolean
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  icon = 'help',
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  variant = 'default',
  details = [],
  isLoading = false,
}: ConfirmationModalProps) {
  // Handle escape key
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      onClose()
    }
  }, [onClose, isLoading])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  const variantColors = {
    default: {
      icon: 'text-primary',
      iconBg: 'bg-primary/10',
      button: 'bg-primary hover:bg-primary-hover text-coffee-dark',
    },
    danger: {
      icon: 'text-error',
      iconBg: 'bg-error/10',
      button: 'bg-error hover:bg-error/90 text-white',
    },
    success: {
      icon: 'text-success',
      iconBg: 'bg-success/10',
      button: 'bg-success hover:bg-success/90 text-white',
    },
  }

  const colors = variantColors[variant]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative bg-cream rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center flex-shrink-0`}>
              <span className={`material-symbols-outlined text-2xl ${colors.icon}`}>
                {icon}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-coffee-dark">{title}</h3>
              <p className="text-sm text-coffee-medium mt-1">{description}</p>
            </div>
          </div>
        </div>

        {/* Details */}
        {details.length > 0 && (
          <div className="px-6 pb-4">
            <div className="bg-white/50 rounded-xl p-4 space-y-3">
              {details.map((detail, index) => (
                <div key={index} className="flex justify-between gap-4">
                  <span className="text-sm text-coffee-medium">{detail.label}</span>
                  <span className="text-sm font-medium text-coffee-dark text-right truncate">
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 pt-2 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl bg-coffee-light/50 text-coffee-dark font-medium
                       hover:bg-coffee-light transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors
                       disabled:opacity-50 flex items-center justify-center gap-2
                       ${colors.button}`}
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                <span>Memproses...</span>
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Preset modal for WhatsApp confirmation
export interface WhatsAppConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  contactName: string
  message: string
  isLoading?: boolean
}

export function WhatsAppConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  contactName,
  message,
  isLoading,
}: WhatsAppConfirmModalProps) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Kirim Pesan WhatsApp?"
      description="Pastikan detail pesan sudah benar sebelum mengirim."
      icon="chat"
      confirmLabel="Kirim Pesan"
      cancelLabel="Batal"
      variant="success"
      isLoading={isLoading}
      details={[
        { label: 'Kepada', value: contactName },
        { label: 'Pesan', value: message.length > 50 ? message.substring(0, 50) + '...' : message },
      ]}
    />
  )
}

// Preset modal for danger actions
export interface DangerConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  isLoading?: boolean
}

export function DangerConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Hapus',
  isLoading,
}: DangerConfirmModalProps) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      description={description}
      icon="warning"
      confirmLabel={confirmLabel}
      cancelLabel="Batal"
      variant="danger"
      isLoading={isLoading}
    />
  )
}
