import StatCardsGrid from './StatCardsGrid'
import SpendingDonutChart from './SpendingDonutChart'
import CashFlowChart from './CashFlowChart'
import BudgetProgressList from './BudgetProgressList'

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <StatCardsGrid />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingDonutChart />
        <CashFlowChart />
      </div>

      <BudgetProgressList />
    </div>
  )
}
