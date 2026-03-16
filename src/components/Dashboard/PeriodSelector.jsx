import { useState } from 'react'
import { format, startOfMonth, parseISO } from 'date-fns'
import { Calendar, ChevronDown, X } from 'lucide-react'
import { Button, Input } from '../ui'

const periods = [
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'last_3_months', label: 'Last 3 Months' },
  { id: 'last_6_months', label: 'Last 6 Months' },
  { id: 'this_year', label: 'This Year' },
  { id: 'all_time', label: 'All Time' },
  { id: 'custom', label: 'Custom Range' },
]

export { periods }

export default function PeriodSelector({ value, onChange, customRange, onCustomRangeChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [showCustomPicker, setShowCustomPicker] = useState(false)
  const [tempStart, setTempStart] = useState(customRange?.start || format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [tempEnd, setTempEnd] = useState(customRange?.end || format(new Date(), 'yyyy-MM-dd'))
  
  const isCustom = value === 'custom'
  const selectedPeriod = periods.find(p => p.id === value) || periods[0]
  
  const displayLabel = isCustom && customRange 
    ? `${format(parseISO(customRange.start), 'MMM d')} - ${format(parseISO(customRange.end), 'MMM d, yyyy')}`
    : selectedPeriod.label

  const handleApplyCustom = () => {
    onCustomRangeChange({ start: tempStart, end: tempEnd })
    onChange('custom')
    setShowCustomPicker(false)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <Button
        variant="secondary"
        onClick={() => setIsOpen(!isOpen)}
        icon={Calendar}
      >
        <span className="max-w-[180px] truncate">{displayLabel}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => {
              setIsOpen(false)
              setShowCustomPicker(false)
            }}
          />
          <div className="absolute right-0 mt-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] z-20 p-2" style={{ minWidth: showCustomPicker ? '280px' : '180px' }}>
            {!showCustomPicker ? (
              <>
                {periods.map(period => (
                  <button
                    key={period.id}
                    onClick={() => {
                      if (period.id === 'custom') {
                        setShowCustomPicker(true)
                      } else {
                        onChange(period.id)
                        setIsOpen(false)
                      }
                    }}
                    className={`w-full text-left px-3 py-2 rounded-[var(--radius-lg)] text-sm transition-colors ${
                      value === period.id 
                        ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)] font-medium' 
                        : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </>
            ) : (
              <div className="p-2">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-sm text-[var(--color-text-primary)]">Custom Range</h4>
                  <button 
                    onClick={() => setShowCustomPicker(false)}
                    className="p-1 rounded-[var(--radius-md)] hover:bg-[var(--color-bg-hover)]"
                  >
                    <X className="w-4 h-4 text-[var(--color-text-muted)]" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <Input
                    label="Start Date"
                    type="date"
                    value={tempStart}
                    onChange={(e) => setTempStart(e.target.value)}
                    size="sm"
                  />
                  <Input
                    label="End Date"
                    type="date"
                    value={tempEnd}
                    onChange={(e) => setTempEnd(e.target.value)}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    size="sm"
                  />
                  <Button 
                    variant="primary"
                    onClick={handleApplyCustom}
                    className="w-full"
                    disabled={!tempStart || !tempEnd || tempStart > tempEnd}
                  >
                    Apply Range
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
