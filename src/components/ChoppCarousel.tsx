import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type CarouselSlide = {
  src: string;
  alt: string;
  titulo: string;
  detalhe: string;
};

const INTERVALO_MS = 5000;

export function ChoppCarousel({ slides }: { slides: CarouselSlide[] }) {
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const inicioToque = useRef<number | null>(null);
  const total = slides.length;

  const irPara = (i: number) => setIndice(((i % total) + total) % total);

  useEffect(() => {
    if (pausado || total <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndice((i) => (i + 1) % total), INTERVALO_MS);
    return () => window.clearInterval(timer);
  }, [pausado, total]);

  const atual = slides[indice];
  if (!atual) return null;

  return (
    <div
      className="group relative overflow-hidden rounded-lg border"
      role="region"
      aria-roledescription="carrossel"
      aria-label="Fotos dos chopps AGNES"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
      onTouchStart={(e) => { inicioToque.current = e.touches[0]?.clientX ?? null; }}
      onTouchEnd={(e) => {
        const inicio = inicioToque.current;
        const fim = e.changedTouches[0]?.clientX;
        inicioToque.current = null;
        if (inicio === null || fim === undefined) return;
        const delta = fim - inicio;
        if (Math.abs(delta) > 40) irPara(indice + (delta < 0 ? 1 : -1));
      }}
    >
      <div className="aspect-[4/3] w-full sm:aspect-[16/9]">
        {slides.map((s, i) => (
          <img
            key={s.src}
            src={s.src}
            alt={s.alt}
            loading={i === 0 ? "eager" : "lazy"}
            aria-hidden={i !== indice}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${i === indice ? "opacity-100" : "opacity-0"}`}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-overlay via-overlay/60 to-transparent p-5 pt-16 sm:p-7 sm:pt-20">
        <p className="eyebrow">{atual.titulo}</p>
        <p className="mt-1 max-w-xl text-sm font-semibold sm:text-base">{atual.detalhe}</p>
      </div>

      <button
        type="button"
        aria-label="Foto anterior"
        onClick={() => irPara(indice - 1)}
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border bg-overlay p-2 opacity-90 transition hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-90"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        aria-label="Próxima foto"
        onClick={() => irPara(indice + 1)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border bg-overlay p-2 opacity-90 transition hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-90"
      >
        <ChevronRight size={20} />
      </button>

      <div className="absolute bottom-3 right-4 flex gap-2 sm:bottom-4 sm:right-6">
        {slides.map((s, i) => (
          <button
            key={s.src}
            type="button"
            aria-label={`Ir para a foto ${i + 1}: ${s.titulo}`}
            aria-current={i === indice}
            onClick={() => irPara(i)}
            className={`h-2 rounded-full transition-all ${i === indice ? "w-6 bg-gold" : "w-2 bg-overlay"}`}
          />
        ))}
      </div>
    </div>
  );
}
