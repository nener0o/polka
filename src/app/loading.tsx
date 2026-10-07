export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-10 w-2/3 max-w-md animate-pulse rounded bg-muted" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="h-56 animate-pulse rounded-xl bg-muted" />
        <div className="h-56 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}
