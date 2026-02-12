import { Clock } from 'lucide-react'
import Modal from '../../components/Modal'
import Badge from '../../components/Badge'

function getStatusBadge(status) {
  switch (status) {
    case 'pending':
      return <Badge variant="warning">Pending</Badge>
    case 'shipped':
      return <Badge variant="neutral">Shipped</Badge>
    case 'received':
      return <Badge variant="info">Received</Badge>
    case 'completed':
      return <Badge variant="success">Completed</Badge>
    default:
      return <Badge variant="neutral">{status}</Badge>
  }
}

export default function ShipmentDetail({ open, onClose, shipment }) {
  if (!shipment) return null

  return (
    <Modal open={open} onClose={onClose} title={shipment.shipment_number} size="xl">
      {/* Summary header */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
        <div>
          <span className="text-[10px] text-(--color-text-muted) block">Status</span>
          <div className="mt-1">{getStatusBadge(shipment.status)}</div>
        </div>
        <div>
          <span className="text-[10px] text-(--color-text-muted) block">Total Weight</span>
          <span className="text-sm font-semibold text-(--color-text-base) tabular-nums">
            {Number(shipment.total_weight_kg).toFixed(2)} kg
          </span>
        </div>
        <div>
          <span className="text-[10px] text-(--color-text-muted) block">Date</span>
          <span className="text-sm text-(--color-text-base)">
            {new Date(shipment.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {shipment.notes && (
        <div className="mb-5">
          <span className="text-[10px] text-(--color-text-muted) block mb-1">Notes</span>
          <p className="text-sm text-(--color-text-subtle)">{shipment.notes}</p>
        </div>
      )}

      {/* Orders table */}
      <div>
        <span className="text-xs font-medium text-(--color-text-subtle) block mb-2">
          Orders ({shipment.order_count})
        </span>
        <div className="rounded-md ring-1 ring-(--color-border-base) overflow-x-auto">
          <table className="w-full text-sm min-w-150">
            <thead>
              <tr className="border-b border-(--color-border-base) bg-(--color-bg-subtle)">
                <th className="text-left text-xs font-semibold text-(--color-text-base) uppercase tracking-wider px-3 py-2">
                  Order #
                </th>
                <th className="text-left text-xs font-semibold text-(--color-text-base) uppercase tracking-wider px-3 py-2">
                  Customer
                </th>
                <th className="text-left text-xs font-semibold text-(--color-text-base) uppercase tracking-wider px-3 py-2">
                  Items
                </th>
                <th className="text-left text-xs font-semibold text-(--color-text-base) uppercase tracking-wider px-3 py-2">
                  Total (UZS)
                </th>
                <th className="text-left text-xs font-semibold text-(--color-text-base) uppercase tracking-wider px-3 py-2">
                  Weight
                </th>
                <th className="text-left text-xs font-semibold text-(--color-text-base) uppercase tracking-wider px-3 py-2">
                  Shipping (UZS)
                </th>
                <th className="text-left text-xs font-semibold text-(--color-text-base) uppercase tracking-wider px-3 py-2">
                  Order Total (UZS)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-border-base)">
              {shipment.orders?.map((order) => (
                <tr key={order.order_id} className="hover:bg-(--color-bg-subtle)">
                  <td className="px-3 py-2 font-medium text-(--color-text-base)">
                    {order.order_number}
                  </td>
                  <td className="px-3 py-2 text-(--color-text-subtle)">
                    {order.customer_name || '—'}
                  </td>
                  <td className="px-3 py-2 text-(--color-text-subtle)">
                    {order.items_summary || '—'}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {order.total_amount_uzs != null
                      ? Number(order.total_amount_uzs).toLocaleString()
                      : '—'}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {Number(order.weight_kg).toFixed(2)} kg
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {Number(order.shipping_fee_uzs).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 tabular-nums font-medium">
                    {Number(order.order_total_uzs).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* History timeline */}
      {shipment.history?.length > 0 && (
        <div className="mt-5">
          <span className="text-xs font-medium text-(--color-text-subtle) block mb-3">
            History
          </span>
          <div>
            {shipment.history.map((entry, idx) => (
              <div key={entry.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3.5 h-3.5 shrink-0 rounded-full bg-(--color-bg-base) ring-2 ring-(--color-border-base) flex items-center justify-center">
                    <Clock className="w-2 h-2 text-(--color-text-muted)" />
                  </div>
                  {idx < shipment.history.length - 1 && (
                    <div className="w-px flex-1 bg-(--color-border-base) my-1" />
                  )}
                </div>
                <div className="min-w-0 pb-4">
                  <p className="text-sm text-(--color-text-base) -mt-0.5">{entry.action}</p>
                  <p className="text-xs text-(--color-text-muted) mt-0.5">
                    {new Date(entry.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  )
}
