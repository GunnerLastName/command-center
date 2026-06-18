export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-16 w-72 rounded-lg bg-muted/30" />
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-48 rounded-xl bg-muted/30" />
        ))}
      </div>
      <div className="h-72 rounded-xl bg-muted/30" />
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-52 rounded-xl bg-muted/30" />
        ))}
      </div>
    </div>
  );
}
