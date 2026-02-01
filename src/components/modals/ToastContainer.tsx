// Toast Container Component
// Displays toast notifications

import { useToastStore, Toast } from '@hooks/useToast'

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()
  
  if (toasts.length === 0) return null
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const { id, type, title, message, action } = toast
  
  const bgColor = {
    success: 'bg-success',
    error: 'bg-error',
    warning: 'bg-warning',
    info: 'bg-info',
  }[type]
  
  const icon = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info',
  }[type]
  
  return (
    <div 
      className={`
        ${bgColor} text-white rounded-xl p-4 shadow-lg
        animate-in slide-in-from-right fade-in duration-300
        min-w-[280px] max-w-sm
      `}
    >
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-xl flex-shrink-0">
          {icon}
        </span>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{title}</p>
          {message && (
            <p className="text-sm opacity-90 mt-0.5">{message}</p>
          )}
          
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 text-xs font-medium underline opacity-90 hover:opacity-100"
            >
              {action.label}
            </button>
          )}
        </div>
        
        <button
          onClick={() => onDismiss(id)}
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
    </div>
  )
}
