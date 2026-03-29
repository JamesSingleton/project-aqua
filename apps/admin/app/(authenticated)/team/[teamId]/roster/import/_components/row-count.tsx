export function RowCount({
  filtered,
  total,
}: {
  filtered: number;
  total: number;
}) {
  return (
    <span className="ml-auto text-muted-foreground text-xs">
      {filtered === total ? `${total} rows` : `${filtered} / ${total} rows`}
    </span>
  );
}
