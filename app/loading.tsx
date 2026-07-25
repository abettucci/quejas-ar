export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <section className="mb-8">
        <div className="h-9 w-96 rounded-md bg-zinc-200 animate-pulse" />
        <div className="mt-2 h-4 w-2/3 rounded bg-zinc-100 animate-pulse" />
      </section>
      <div className="mb-6 flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-7 w-20 rounded-full bg-zinc-200 animate-pulse" />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-zinc-200 bg-white p-5">
            <div className="mb-3 h-5 w-3/4 rounded bg-zinc-200 animate-pulse" />
            <div className="mb-2 h-4 w-full rounded bg-zinc-100 animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-zinc-100 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
