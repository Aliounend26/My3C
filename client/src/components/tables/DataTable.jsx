import { useMemo, useState } from "react";

const compareValues = (left, right, direction) => {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;

  if (typeof left === "number" && typeof right === "number") {
    return direction === "asc" ? left - right : right - left;
  }

  if (left instanceof Date && right instanceof Date) {
    return direction === "asc" ? left - right : right - left;
  }

  const leftValue = String(left).toLowerCase();
  const rightValue = String(right).toLowerCase();
  return direction === "asc" ? leftValue.localeCompare(rightValue, "fr") : rightValue.localeCompare(leftValue, "fr");
};

export const DataTable = ({ columns, rows, defaultSort }) => {
  const [sortState, setSortState] = useState(defaultSort || null);

  const sortedRows = useMemo(() => {
    if (!sortState) return rows;

    const selectedColumn = columns.find((column) => column.key === sortState.key);
    if (!selectedColumn?.sortable) return rows;

    const getSortableValue = (row) => {
      if (selectedColumn.sortValue) return selectedColumn.sortValue(row);
      return row[selectedColumn.key];
    };

    return [...rows].sort((leftRow, rightRow) =>
      compareValues(getSortableValue(leftRow), getSortableValue(rightRow), sortState.direction)
    );
  }, [columns, rows, sortState]);

  const toggleSort = (column) => {
    if (!column.sortable) return;

    setSortState((current) => {
      if (!current || current.key !== column.key) {
        return { key: column.key, direction: "asc" };
      }

      if (current.direction === "asc") {
        return { key: column.key, direction: "desc" };
      }

      return null;
    });
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => {
                const active = sortState?.key === column.key;
                const indicator = !column.sortable ? "" : active ? (sortState.direction === "asc" ? "↑" : "↓") : "↕";

                return (
                  <th key={column.key} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {column.sortable ? (
                      <button className="flex items-center gap-2 text-left" onClick={() => toggleSort(column)} type="button">
                        <span>{column.label}</span>
                        <span className={`text-[11px] ${active ? "text-brand-500" : "text-slate-300"}`}>{indicator}</span>
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedRows.map((row, index) => (
              <tr key={row.id || row._id || index} className="text-sm text-slate-700">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 align-top">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
