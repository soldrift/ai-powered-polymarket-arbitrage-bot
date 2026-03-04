"use client";

export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={style}
      aria-hidden
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card">
      <Skeleton style={{ width: "60%", height: 12, marginBottom: 8 }} />
      <Skeleton style={{ width: "80%", height: 24 }} />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="tableWrap">
      <table className="table">
        <thead>
          <tr>
            <th><Skeleton style={{ height: 14, width: 60 }} /></th>
            <th><Skeleton style={{ height: 14, width: 40 }} /></th>
            <th><Skeleton style={{ height: 14, width: 40 }} /></th>
            <th><Skeleton style={{ height: 14, width: 50 }} /></th>
            <th><Skeleton style={{ height: 14, width: 60 }} /></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td><Skeleton style={{ height: 12, width: "90%" }} /></td>
              <td><Skeleton style={{ height: 12, width: 40 }} /></td>
              <td><Skeleton style={{ height: 12, width: 50 }} /></td>
              <td><Skeleton style={{ height: 12, width: 40 }} /></td>
              <td><Skeleton style={{ height: 12, width: 50 }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
