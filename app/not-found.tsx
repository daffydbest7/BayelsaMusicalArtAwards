import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center p-8 bg-brand-bg text-brand-white min-h-screen">
      <main className="flex flex-col items-center justify-center max-w-md text-center gap-6">
        <div className="font-mono text-brand-gold text-lg border border-brand-gold/30 px-3 py-1 rounded bg-brand-surface/50">
          404 ERROR
        </div>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-brand-gold">
          Beyond the Plains
        </h1>
        <p className="font-sans text-brand-white/75 text-base">
          The stage you are looking for does not exist, or you do not have permission to view it.
        </p>
        <div className="w-12 h-[1px] bg-brand-brown-deep"></div>
        <Link
          href="/"
          className="font-sans font-semibold text-sm bg-brand-gold text-brand-bg px-6 py-3 rounded-md glow-gold-hover hover:glow-gold transition-all duration-200"
        >
          Return to Stage
        </Link>
      </main>
    </div>
  );
}
