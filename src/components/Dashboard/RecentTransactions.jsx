import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import { useMoney } from '@/context/MoneyContext'
import { formatCurrency } from '@/utils/calculations'
import { getCategoryById } from '@/data/categories'
import { getIconComponent } from '@/utils/iconResolver'

export default function RecentTransactions() {
  const { state } = useMoney()
  const { expenses, settings, customCategories = [], categoryOverrides = {} } = state
  const sym = settings?.currencySymbol || '$'
  const navigate = useNavigate()

  const recent = useMemo(() => {
    return [...expenses]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 7)
  }, [expenses])

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Recent Transactions</h3>
        <button
          onClick={() => navigate('/transactions')}
          className="text-xs font-medium text-primary-500 hover:text-primary-600 cursor-pointer"
        >
          View all
        </button>
      </div>
      {recent.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">No transactions yet</p>
      ) : (
        <div className="space-y-1">
          {recent.map((tx) => {
            const cat = getCategoryById(tx.category, customCategories, categoryOverrides)
            const Icon = getIconComponent(cat?.icon)
            return (
              <div key={tx.id} className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors">
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                  style={{ backgroundColor: cat?.color ? `${cat.color}15` : '#f1f5f9' }}
                >
                  <Icon className="w-4 h-4" style={{ color: cat?.color || '#64748b' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {tx.description || tx.merchant || cat?.name || 'Transaction'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {tx.paymentMethod && ` · ${tx.paymentMethod}`}
                  </p>
                </div>
                <span className="text-sm font-semibold font-number text-danger-600">
                  -{formatCurrency(tx.amount, sym)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
