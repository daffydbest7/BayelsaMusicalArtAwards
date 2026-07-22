export function Footer() {
  return (
    <footer className="py-10 text-center border-t border-brand-brown-deep/20 bg-brand-surface/20">
      <div className="flex flex-col gap-3 max-w-4xl mx-auto px-4">
        <p className="font-heading text-sm text-brand-gold font-bold tracking-widest">
          #BMAA2026 #BEYONDTHEPLAINS
        </p>
        <p className="font-sans text-xs text-brand-white/50">
          © 2026 Bayelsa Musical Artiste Awards. All rights reserved. Follow us on Socials @BMAAOfficial.
        </p>
        <p className="font-sans text-[11px] text-brand-white/40 mt-0.5">
          Designed & Developed by{" "}
          <span className="text-brand-gold font-semibold">Jedaverse Integrated Services</span>
        </p>
      </div>
    </footer>
  );
}
