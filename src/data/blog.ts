// Entradas de avelrom.es etiquetadas «lopublico»: alimentan el apartado Blog.
// Se leen del RSS del blog en build/dev (la etiqueta sale como <category>). Si no hay ninguna, o el feed
// no responde, la lista queda vacía y el apartado Blog no existe: ni enlace en el menú ni página.
//
// Variable de entorno (solo para desarrollo):
//   BLOG_FEED_URL  feed alternativo, p. ej. http://localhost:4321/rss/rss.xml con el blog en local
export interface EntradaBlog {
  titulo: string;
  descripcion: string;
  url: string;
  fecha: Date;
}

const ETIQUETA = 'lopublico';
const FEED = process.env.BLOG_FEED_URL || 'https://avelrom.es/rss/rss.xml';

const decodificar = (t: string) =>
  t.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&')
    .trim();

const campo = (item: string, nombre: string) => {
  const m = item.match(new RegExp(`<${nombre}[^>]*>([\\s\\S]*?)</${nombre}>`));
  return m ? decodificar(m[1]) : '';
};

async function leer(): Promise<EntradaBlog[]> {
  try {
    const r = await fetch(FEED, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return [];
    const xml = await r.text();
    return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
      .map((m) => m[1])
      .filter((item) => [...item.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/g)].some((c) => decodificar(c[1]).toLowerCase() === ETIQUETA))
      .map((item) => ({ titulo: campo(item, 'title'), descripcion: campo(item, 'description'), url: campo(item, 'link'), fecha: new Date(campo(item, 'pubDate')) }))
      .filter((e) => e.titulo && e.url)
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  } catch {
    return [];
  }
}

let cache: Promise<EntradaBlog[]> | undefined;
export function getEntradasBlog(): Promise<EntradaBlog[]> {
  cache ??= leer();
  return cache;
}
