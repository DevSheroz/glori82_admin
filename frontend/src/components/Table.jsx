export default function Table({ columns, data, onRowClick }) {
  return (
    <div className="overflow-x-auto">
      <div className="max-h-[calc(100vh-220px)] md:max-h-[calc(100vh-220px)] overflow-y-auto min-w-150">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b-2 border-(--color-border-base) bg-(--color-bg-subtle) shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left text-xs font-semibold text-(--color-text-base) uppercase tracking-wider px-3 md:px-4 py-3"
                  style={{ ...(col.width && { width: col.width }), ...(col.minWidth && { minWidth: col.minWidth }) }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-(--color-border-base)">
            {data.map((row, i) => (
              <tr
                key={row.id ?? row.order_id ?? row.product_id ?? row.customer_id ?? row.shipment_id ?? i}
                className="hover:bg-(--color-bg-subtle) transition-colors cursor-pointer"
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-3 md:px-4 py-3 ${col.nowrap === false ? '' : 'whitespace-nowrap'}`}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
