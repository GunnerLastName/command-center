export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-10 w-24 rounded-lg bg-muted/30" />
      <div className="h-28 rounded-xl bg-muted/30" />
      <div className="h-10 w-48 rounded-lg bg-muted/30" />
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-muted/30" />
        ))}
      </div>
    </div>
  );
}
