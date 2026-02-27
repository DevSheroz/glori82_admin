import { Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Modal from '../../components/Modal'
import Badge from '../../components/Badge'

export default function ShipmentDetail({ open, onClose, shipment }) {
  if (!shipment) return null

  const { t } = useTranslation()

  function getStatusBadge(status) {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">{t('shipments.status.pending')}</Badge>
      case 'shipped':
        return <Badge variant="neutral">{t('shipments.status.shipped')}</Badge>
      case 'arrived':
        return <Badge variant="teal">{t('shipments.status.arrived')}</Badge>
      case 'received':
        return <Badge variant="info">{t('shipments.status.received')}</Badge>
      case 'completed':
        return <Badge variant="success">{t('shipments.status.completed')}</Badge>
      default:
        return <Badge variant="neutral">{status}</Badge>
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={shipment.shipment_number} size="xl">
      {/* Summary header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <div>
          <span className="text-[10px] text-(--color-text-muted) block">{t('common.status')}</span>
          <div className="mt-1">{getStatusBadge(shipment.status)}</div>
        </div>
        <div>
          <span className="text-[10px] text-(--color-text-muted) block">{t('shipments.detail.total_weight')}</span>
          <span className="text-sm font-semibold text-(--color-text-base) tabular-nums">
            {Number(shipment.total_weight_kg).toFixed(2)} kg
          </span>
        </div>
        <div>
          <span className="text-[10px] text-(--color-text-muted) block">{t('shipments.detail.service_fee')}</span>
          <span className="text-sm font-semibold text-(--color-text-base) tabular-nums">
            ${Number(shipment.total_service_fee_usd).toFixed(2)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-(--color-text-muted) block">{t('common.date')}</span>
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
          <span className="text-[10px] text-(--color-text-muted) block mb-1">{t('common.notes')}</span>
          <p className="text-sm text-(--color-text-subtle)">{shipment.notes}</p>
        </div>
      )}

      {/* Orders table */}
      <div>
        <span className="text-xs font-medium text-(--color-text-subtle) block mb-2">
          {t('shipments.detail.orders', { count: shipment.order_count })}
        </span>
        <div className="rounded-md ring-1 ring-(--color-border-base) overflow-x-auto">
          <table className="w-full text-sm min-w-150">
            <thead>
              <tr className="border-b border-(--color-border-base) bg-(--color-bg-subtle)">
                <th className="text-left text-xs font-semibold text-(--color-text-base) px-3 py-2">
                  {t('shipments.detail.order_num')}
                </th>
                <th className="text-left text-xs font-semibold text-(--color-text-base) px-3 py-2">
                  {t('common.customer')}
                </th>
                <th className="text-left text-xs font-semibold text-(--color-text-base) px-3 py-2">
                  {t('common.status')}
                </th>
                <th className="text-left text-xs font-semibold text-(--color-text-base) px-3 py-2">
                  {t('common.items')}
                </th>
                <th className="text-left text-xs font-semibold text-(--color-text-base) px-3 py-2">
                  {t('shipments.detail.selling_usd')}
                </th>
                <th className="text-left text-xs font-semibold text-(--color-text-base) px-3 py-2">
                  {t('common.weight')}
                </th>
                <th className="text-left text-xs font-semibold text-(--color-text-base) px-3 py-2">
                  {t('shipments.detail.cargo')}
                </th>
                <th className="text-left text-xs font-semibold text-(--color-text-base) px-3 py-2">
                  {t('shipments.detail.total_uzs')}
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
                  <td className="px-3 py-2">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-3 py-2 text-(--color-text-subtle)">
                    {order.items_summary || '—'}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {order.selling_usd != null
                      ? `$${Number(order.selling_usd).toFixed(2)}`
                      : '—'}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {Number(order.weight_kg).toFixed(2)} kg
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {order.customer_cargo_usd != null
                      ? `$${Number(order.customer_cargo_usd).toFixed(2)}`
                      : '—'}
                  </td>
                  <td className="px-3 py-2 tabular-nums font-medium">
                    {Number(order.order_total_uzs).toLocaleString()} UZS
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* In-stock items table */}
      {shipment.stock_items?.length > 0 && (
        <div className="mt-5">
          <span className="text-xs font-medium text-(--color-text-subtle) block mb-2">
            {t('shipments.detail.in_stock_items', { count: shipment.stock_items.length })}
          </span>
          <div className="rounded-md ring-1 ring-(--color-border-base) overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-(--color-border-base) bg-(--color-bg-subtle)">
                  <th className="text-left text-xs font-semibold text-(--color-text-base) px-3 py-2">{t('common.product')}</th>
                  <th className="text-left text-xs font-semibold text-(--color-text-base) px-3 py-2">{t('common.qty')}</th>
                  <th className="text-left text-xs font-semibold text-(--color-text-base) px-3 py-2">{t('common.weight')}</th>
                  <th className="text-left text-xs font-semibold text-(--color-text-base) px-3 py-2">{t('shipments.detail.cost_krw')}</th>
                  <th className="text-left text-xs font-semibold text-(--color-text-base) px-3 py-2">{t('shipments.detail.selling_usd')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-border-base)">
                {shipment.stock_items.map((item) => (
                  <tr key={item.product_id} className="hover:bg-(--color-bg-subtle)">
                    <td className="px-3 py-2 font-medium text-(--color-text-base)">{item.product_name}</td>
                    <td className="px-3 py-2 tabular-nums text-(--color-text-subtle)">{item.quantity}</td>
                    <td className="px-3 py-2 tabular-nums text-(--color-text-subtle)">
                      {Number(item.weight_kg).toFixed(2)} kg
                    </td>
                    <td className="px-3 py-2 tabular-nums text-(--color-text-subtle)">
                      {Number(item.cost_price_krw).toLocaleString()} ₩
                    </td>
                    <td className="px-3 py-2 tabular-nums text-(--color-text-subtle)">
                      {item.selling_price_usd != null
                        ? `$${Number(item.selling_price_usd).toFixed(2)}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History timeline */}
      {shipment.history?.length > 0 && (
        <div className="mt-5">
          <span className="text-xs font-medium text-(--color-text-subtle) block mb-3">
            {t('shipments.detail.history')}
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
