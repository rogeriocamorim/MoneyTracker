import { X, Pencil, Trash2, Calendar, Tag, CreditCard, FileText } from 'lucide-react'
import { parseISO } from 'date-fns'
import { Button, Badge } from '@/components/ui'
import { getCategoryById } from '@/data/categories'
import { formatCurrency } from '@/utils/calculations'

export default function TransactionDetail({ transaction, currency, customCategories, categoryOverrides = {}, onClose, onEdit, onDelete }) {
  const tx = transaction
  const cat = getCategoryById(tx.category, customCategories, categoryOverrides)

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white shadow-xl border-l border-slate-200 flex flex-col animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">Transaction Details</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <div className="text-center pb-4 border-b border-slate-100">
          <p className="text-3xl font-bold font-number text-danger-600">
            -{formatCurrency(tx.amount, currency)}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {tx.description || tx.merchant || 'Transaction'}
          </p>
        </div>

        <DetailRow icon={Calendar} label="Date">
          {parseISO(tx.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </DetailRow>

        {cat && (
          <DetailRow icon={Tag} label="Category">
            <Badge variant="neutral">{cat.name}</Badge>
          </DetailRow>
        )}

        {tx.paymentMethod && (
          <DetailRow icon={CreditCard} label="Payment Method">
            <span className="capitalize">{tx.paymentMethod.replace(/_/g, ' ')}</span>
          </DetailRow>
        )}

        {tx.merchant && (
          <DetailRow icon={FileText} label="Merchant">
            {tx.merchant}
          </DetailRow>
        )}

        {tx.tags?.length > 0 && (
          <DetailRow icon={Tag} label="Tags">
            <div className="flex flex-wrap gap-1">
              {tx.tags.map((tag) => (
                <Badge key={tag} variant="primary" size="sm">{tag}</Badge>
              ))}
            </div>
          </DetailRow>
        )}

        {tx.notes && (
          <DetailRow icon={FileText} label="Notes">
            <p className="text-sm text-slate-600">{tx.notes}</p>
          </DetailRow>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 px-5 py-4 border-t border-slate-100">
        <Button variant="outline" size="sm" icon={Pencil} onClick={onEdit} className="flex-1">
          Edit
        </Button>
        <Button variant="danger" size="sm" icon={Trash2} onClick={onDelete} className="flex-1">
          Delete
        </Button>
      </div>
    </div>
  )
}

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
        <div className="mt-0.5 text-sm text-slate-700">{children}</div>
      </div>
    </div>
  )
}
