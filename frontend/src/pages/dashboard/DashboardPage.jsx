import { useCallback, useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts'
import {
  TrendingUp, DollarSign, AlertCircle, ShoppingBag,
} from 'lucide-react'
import { dashboardApi } from '../../lib/api'

// ─── Formatters ─────────────────────────────────────────────────────────────

function fmtUSD(v) {
  return '$' + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtUZS(v) {
  return Number(v || 0).toLocaleString('uz-UZ', { maximumFractionDigits: 0 }) + ' UZS'
}
function fmtKRW(v) {
  return '₩' + Number(v || 0).toLocaleString('ko-KR', { maximumFractionDigits: 0 })
}
function fmtNum(v) {
  return Number(v || 0).toLocaleString()
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-(--color-bg-component) rounded ${className}`} />
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, color = 'indigo', loading }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    sky: 'bg-sky-50 text-sky-600',
  }
  return (
    <div className="bg-white rounded-xl border border-(--color-border-base) p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-(--color-text-muted) uppercase tracking-wide mb-1">{label}</p>
        {loading
          ? <Skeleton className="h-6 w-28 mb-1" />
          : <p className="text-xl font-semibold text-(--color-text-base) truncate">{value}</p>
        }
        {sub && !loading && (
          <p className="text-xs text-(--color-text-muted) mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  )
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-(--color-border-base) p-5">
      {title && <h2 className="text-sm font-semibold text-(--color-text-base) mb-4">{title}</h2>}
      {children}
    </div>
  )
}

// ─── Status badge (simple colored dot + label) ───────────────────────────────

const STATUS_COLORS = {
  pending:   { dot: '#f59e0b', label: 'Pending' },
  shipped:   { dot: '#6366f1', label: 'Shipped' },
  arrived:   { dot: '#0ea5e9', label: 'Arrived' },
  received:  { dot: '#8b5cf6', label: 'Received' },
  completed: { dot: '#22c55e', label: 'Completed' },
}

// ─── Custom tooltip for charts ───────────────────────────────────────────────

function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-(--color-border-base) rounded-lg shadow-sm p-3 text-xs">
      <p className="font-medium text-(--color-text-base) mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="flex gap-2">
          <span>{p.name}:</span>
          <span className="font-medium">{formatter ? formatter(p.value, p.name) : p.value}</span>
        </p>
      ))}
    </div>
  )
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null)
  const [profit, setProfit] = useState(null)
  const [unpaid, setUnpaid] = useState([])
  const [statusSummary, setStatusSummary] = useState([])
  const [shipmentCosts, setShipmentCosts] = useState([])
  const [shipmentRevenue, setShipmentRevenue] = useState([])
  const [monthlyRevenue, setMonthlyRevenue] = useState([])
  const [salesOverTime, setSalesOverTime] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [
      metricsRes,
      profitRes,
      unpaidRes,
      statusRes,
      shipCostRes,
      shipRevRes,
      monthlyRes,
      salesRes,
      topRes,
    ] = await Promise.allSettled([
      dashboardApi.getMetrics(),
      dashboardApi.getProfitSummary(),
      dashboardApi.getUnpaidOrders(),
      dashboardApi.getOrderStatusSummary(),
      dashboardApi.getShipmentCosts(),
      dashboardApi.getShipmentRevenue(),
      dashboardApi.getMonthlyRevenue(),
      dashboardApi.getSalesOverTime(),
      dashboardApi.getTopProducts({ limit: 7 }),
    ])

    const failed = [metricsRes, profitRes, unpaidRes, statusRes, shipCostRes, shipRevRes, monthlyRes, salesRes, topRes]
      .filter(r => r.status === 'rejected')
    if (failed.length > 0) {
      setError(failed.map(r => r.reason?.message ?? 'Unknown error').join(' | '))
    }

    if (metricsRes.status === 'fulfilled') setMetrics(metricsRes.value.data)
    if (profitRes.status === 'fulfilled') setProfit(profitRes.value.data)
    if (unpaidRes.status === 'fulfilled') setUnpaid(unpaidRes.value.data)
    if (statusRes.status === 'fulfilled') setStatusSummary(statusRes.value.data)
    if (shipCostRes.status === 'fulfilled') setShipmentCosts(shipCostRes.value.data)
    if (shipRevRes.status === 'fulfilled') setShipmentRevenue(shipRevRes.value.data.map(s => ({
      ...s,
      revenue_usd: Number(s.revenue_usd),
      profit_usd: Number(s.profit_usd),
    })))
    if (monthlyRes.status === 'fulfilled') setMonthlyRevenue(monthlyRes.value.data.map(m => ({
      ...m,
      revenue_usd: Number(m.revenue_usd),
      profit_usd: Number(m.profit_usd),
    })))
    if (salesRes.status === 'fulfilled') setSalesOverTime(salesRes.value.data.map(d => ({
      ...d,
      total_sales: Number(d.total_sales),
    })))
    if (topRes.status === 'fulfilled') setTopProducts(topRes.value.data.map(p => ({
      ...p,
      total_revenue: Number(p.total_revenue),
    })))

    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── KPI data ──────────────────────────────────────────────────────────────
  const totalUnpaidUZS = unpaid.reduce((s, o) => s + Number(o.unpaid_uzs), 0)

  const kpiCards = [
    {
      icon: TrendingUp,
      label: 'Total Revenue',
      value: fmtUSD(profit?.total_revenue_usd),
      sub: `${fmtNum(metrics?.sales_count)} completed orders`,
      color: 'indigo',
    },
    {
      icon: DollarSign,
      label: 'Gross Profit',
      value: fmtUSD(profit?.gross_profit_usd),
      sub: `After product cost & cargo`,
      color: 'emerald',
    },
    {
      icon: AlertCircle,
      label: 'Total Unpaid',
      value: fmtUZS(totalUnpaidUZS),
      sub: `${unpaid.length} orders outstanding`,
      color: 'rose',
    },
    {
      icon: ShoppingBag,
      label: 'Total Orders',
      value: fmtNum(profit?.total_orders),
      sub: `All time`,
      color: 'sky',
    },
  ]

  // ── Status donut data ─────────────────────────────────────────────────────
  const statusChartData = statusSummary.map(s => ({
    name: STATUS_COLORS[s.status]?.label ?? s.status,
    value: s.count,
    color: STATUS_COLORS[s.status]?.dot ?? '#d1d5db',
  }))

  // ── Sales chart: last 30 data points ─────────────────────────────────────
  const salesChartData = salesOverTime.slice(-30).map(d => ({
    date: d.date,
    Sales: d.total_sales,
  }))

  // ── Top products horizontal bars ─────────────────────────────────────────
  const topProductsData = topProducts.map(p => ({
    name: p.product_name.length > 20 ? p.product_name.slice(0, 20) + '…' : p.product_name,
    Revenue: p.total_revenue,
  }))

  // ── Shipment cost charts ──────────────────────────────────────────────────
  const shipKrwData = shipmentCosts.map(s => ({
    name: s.shipment_number,
    'Product Cost (KRW)': Number(s.product_cost_krw),
  }))
  const shipUsdData = shipmentCosts.map(s => ({
    name: s.shipment_number,
    'Cargo Cost (USD)': Number(s.cargo_cost_usd),
  }))

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-(--color-text-base)">Dashboard</h1>
        <p className="text-sm text-(--color-text-muted) mt-0.5">Business overview</p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-4 py-3 text-sm">
          <strong>Failed to load some data:</strong> {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(card => (
          <KpiCard key={card.label} {...card} loading={loading} />
        ))}
      </div>

      {/* Row: Unpaid list + Order Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Unpaid Orders Table — takes 2/3 width */}
        <div className="lg:col-span-2">
          <Section title={`Unpaid Orders (${unpaid.length})`}>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : unpaid.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-(--color-text-muted)">
                <DollarSign className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">All orders are paid</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-(--color-border-base)">
                        <th className="text-left text-xs font-medium text-(--color-text-muted) pb-2 pr-3">Order</th>
                        <th className="text-left text-xs font-medium text-(--color-text-muted) pb-2 pr-3">Customer</th>
                        <th className="text-left text-xs font-medium text-(--color-text-muted) pb-2 pr-3">Status</th>
                        <th className="text-right text-xs font-medium text-(--color-text-muted) pb-2 pr-3">Total</th>
                        <th className="text-right text-xs font-medium text-(--color-text-muted) pb-2">Unpaid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unpaid.map(order => (
                        <tr
                          key={order.order_id}
                          className="border-b border-(--color-border-base) last:border-0 hover:bg-(--color-bg-subtle) transition-colors"
                        >
                          <td className="py-2.5 pr-3 font-medium text-(--color-text-base) whitespace-nowrap">
                            {order.order_number}
                          </td>
                          <td className="py-2.5 pr-3 text-(--color-text-subtle) truncate max-w-35">
                            {order.customer_name ?? '—'}
                          </td>
                          <td className="py-2.5 pr-3">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-(--color-bg-component) text-(--color-text-subtle) capitalize">
                              {order.payment_status}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3 text-right text-(--color-text-subtle) whitespace-nowrap text-xs">
                            {order.total_price_uzs ? fmtUZS(order.total_price_uzs) : '—'}
                          </td>
                          <td className="py-2.5 text-right font-semibold text-rose-600 whitespace-nowrap">
                            {fmtUZS(order.unpaid_uzs)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Totals row */}
                <div className="mt-3 pt-3 border-t border-(--color-border-base) flex justify-between items-center">
                  <span className="text-xs text-(--color-text-muted)">{unpaid.length} outstanding orders</span>
                  <span className="text-sm font-semibold text-rose-600">{fmtUZS(totalUnpaidUZS)}</span>
                </div>
              </div>
            )}
          </Section>
        </div>

        {/* Order Status Donut — takes 1/3 width */}
        <Section title="Order Status">
          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : statusChartData.length === 0 ? (
            <div className="flex items-center justify-center h-56 text-(--color-text-muted) text-sm">No data</div>
          ) : (
            <div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length
                        ? <div className="bg-white border border-(--color-border-base) rounded-lg shadow-sm p-2 text-xs">
                            <p className="font-medium">{payload[0].name}</p>
                            <p className="text-(--color-text-muted)">{payload[0].value} orders</p>
                          </div>
                        : null
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="mt-2 space-y-1.5">
                {statusChartData.map(s => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="text-(--color-text-subtle)">{s.name}</span>
                    </div>
                    <span className="font-medium text-(--color-text-base)">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>
      </div>

      {/* Row: Shipment Revenue & Profit */}
      <Section title="Revenue & Profit per Shipment (USD)">
        {loading ? (
          <Skeleton className="h-52 w-full" />
        ) : shipmentRevenue.length === 0 ? (
          <div className="flex items-center justify-center h-52 text-(--color-text-muted) text-sm">No shipments</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={shipmentRevenue} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-base)" />
              <XAxis dataKey="shipment_number" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                tickFormatter={v => '$' + v.toFixed(0)}
                width={55}
              />
              <Tooltip content={<ChartTooltip formatter={v => fmtUSD(v)} />} />
              <Bar dataKey="revenue_usd" name="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit_usd" name="Profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Section>

      {/* Row: Monthly Revenue & Profit */}
      <Section title="Monthly Revenue & Profit (USD, all orders)">
        {loading ? (
          <Skeleton className="h-52 w-full" />
        ) : monthlyRevenue.length === 0 ? (
          <div className="flex items-center justify-center h-52 text-(--color-text-muted) text-sm">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyRevenue} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-base)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                tickFormatter={v => '$' + v.toFixed(0)}
                width={55}
              />
              <Tooltip content={<ChartTooltip formatter={v => fmtUSD(v)} />} />
              <Bar dataKey="revenue_usd" name="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit_usd" name="Profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Section>

      {/* Row: Shipment Cost charts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Product Cost per Shipment (KRW) */}
        <Section title="Product Cost per Shipment (₩ KRW)">
          {loading ? (
            <Skeleton className="h-52 w-full" />
          ) : shipKrwData.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-(--color-text-muted) text-sm">No shipments</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={shipKrwData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-base)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                  tickFormatter={v => '₩' + (v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)}
                  width={60}
                />
                <Tooltip content={<ChartTooltip formatter={(v) => fmtKRW(v)} />} />
                <Bar dataKey="Product Cost (KRW)" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>

        {/* Cargo Cost per Shipment (USD) */}
        <Section title="Business Cargo Cost per Shipment ($ USD @ $12/kg)">
          {loading ? (
            <Skeleton className="h-52 w-full" />
          ) : shipUsdData.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-(--color-text-muted) text-sm">No shipments</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={shipUsdData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-base)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                  tickFormatter={v => '$' + v.toFixed(0)}
                  width={50}
                />
                <Tooltip content={<ChartTooltip formatter={(v) => fmtUSD(v)} />} />
                <Bar dataKey="Cargo Cost (USD)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>
      </div>

      {/* Row: Profit breakdown cards */}
      <Section title="Revenue & Cost Breakdown">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Selling Revenue', value: fmtUSD(profit?.total_selling_usd), color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Service Fees', value: fmtUSD(profit?.total_service_fee_usd), color: 'text-sky-600', bg: 'bg-sky-50' },
              { label: 'Product Cost', value: fmtKRW(profit?.total_product_cost_krw), color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Business Cargo', value: fmtUSD(profit?.total_business_cargo_usd), color: 'text-orange-600', bg: 'bg-orange-50' },
            ].map(item => (
              <div key={item.label} className={`${item.bg} rounded-lg p-4`}>
                <p className="text-xs font-medium text-(--color-text-muted) mb-1">{item.label}</p>
                <p className={`text-base font-semibold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Row: Sales over time + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Sales over time takes 2/3 */}
        <div className="lg:col-span-2">
          <Section title="Sales Over Time (completed orders, USD)">
            {loading ? (
              <Skeleton className="h-56 w-full" />
            ) : salesChartData.length === 0 ? (
              <div className="flex items-center justify-center h-56 text-(--color-text-muted) text-sm">
                No completed orders yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={salesChartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-base)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                    tickFormatter={d => {
                      const date = new Date(d)
                      return `${date.getMonth() + 1}/${date.getDate()}`
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                    tickFormatter={v => '$' + v.toFixed(0)}
                    width={50}
                  />
                  <Tooltip
                    content={<ChartTooltip formatter={(v) => fmtUSD(v)} />}
                  />
                  <Line
                    type="monotone"
                    dataKey="Sales"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#6366f1' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Section>
        </div>

        {/* Top products takes 1/3 */}
        <Section title="Top Products by Revenue">
          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : topProductsData.length === 0 ? (
            <div className="flex items-center justify-center h-56 text-(--color-text-muted) text-sm">
              No data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={topProductsData}
                layout="vertical"
                margin={{ top: 4, right: 8, left: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-base)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                  tickFormatter={v => '$' + (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toFixed(0))}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                  width={90}
                />
                <Tooltip
                  content={<ChartTooltip formatter={(v) => fmtUSD(v)} />}
                />
                <Bar dataKey="Revenue" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>
      </div>
    </div>
  )
}
