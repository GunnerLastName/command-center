export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-10 w-40 rounded-lg bg-muted/30" />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="h-96 rounded-xl bg-muted/30 lg:col-span-3" />
        <div className="space-y-2 lg:col-span-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-muted/30" />
          ))}
        </div>
      </div>
    </div>
  );
}
