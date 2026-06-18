export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-10 w-40 rounded-lg bg-muted/30" />
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="h-56 rounded-xl bg-muted/30 lg:col-span-2" />
        <div className="h-56 rounded-xl bg-muted/30 lg:col-span-3" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-44 rounded-xl bg-muted/30" />
        <div className="h-44 rounded-xl bg-muted/30" />
      </div>
    </div>
  );
}
