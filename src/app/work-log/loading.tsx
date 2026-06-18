export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-10 w-32 rounded-lg bg-muted/30" />
      <div className="h-28 rounded-xl bg-muted/30" />
      <div className="h-24 rounded-xl bg-muted/30" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 rounded-xl bg-muted/30" />
        <div className="h-64 rounded-xl bg-muted/30" />
      </div>
    </div>
  );
}
