// scripts/scraper.js
// 5 supermercados: Mercadona, Lidl, Carrefour, Aldi, Eroski
// ~500 términos de búsqueda basados en consumo real español

import fetch from 'node-fetch';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APIFY_TOKEN = process.env.APIFY_TOKEN;

if (!APIFY_TOKEN) {
  console.error('❌ APIFY_TOKEN no encontrado. Revisa tus secrets de GitHub.');
  process.exit(1);
}

// ============================================================
// ACTORES DE APIFY
// ============================================================
const ACTORS = {
  mercadona: 'aitorsm/mercadona-product-scraper',
  carrefour:  '123webdata/carrefour-scraper',
  lidl:       'easyapi/lidl-product-scraper',
  aldi:       'easyapi/aldi-scraper',
  eroski:     'easyapi/eroski-scraper'
};

// ============================================================
// 500 PRODUCTOS — basados en datos reales de consumo español
// (Kantar Worldpanel, Brand Footprint España, INE)
// ============================================================

// BLOQUE A: 250 productos esenciales (80% del ticket semanal)
const TERMINOS_ESENCIALES = [
  // LÁCTEOS
  'leche entera', 'leche semidesnatada', 'leche desnatada', 'leche sin lactosa',
  'leche evaporada', 'leche condensada', 'nata para cocinar', 'nata para montar',
  'mantequilla', 'margarina', 'yogur natural', 'yogur griego', 'yogur sabores',
  'yogur liquido', 'queso fresco', 'queso manchego', 'queso tierno', 'queso curado',
  'queso rallado', 'queso en lonchas', 'queso brie', 'queso mozzarella',
  'cuajada', 'natillas', 'flan', 'mousse chocolate', 'petit suisse',

  // HUEVOS
  'huevos medianos', 'huevos grandes', 'huevos camperos', 'huevos ecologicos',

  // PAN Y PANADERÍA
  'pan de molde', 'pan integral molde', 'pan bimbo', 'pan de barra', 'pan chapata',
  'pan tostado', 'tostadas integrales', 'biscotes', 'pan rallado', 'harina trigo',
  'harina reposteria', 'levadura', 'croissant', 'magdalenas', 'bizcocho',

  // ACEITES Y VINAGRES
  'aceite oliva virgen extra', 'aceite oliva', 'aceite girasol', 'aceite de maiz',
  'vinagre vino blanco', 'vinagre vino tinto', 'vinagre modena',

  // ARROZ, PASTA Y LEGUMBRES
  'arroz largo', 'arroz redondo', 'arroz basmati', 'arroz integral',
  'espagueti', 'macarrones', 'tallarines', 'pasta tornillos', 'lasaña placas',
  'pasta rellena', 'fideos finos', 'fideos gruesos',
  'lentejas', 'garbanzos', 'judias blancas', 'judias pintas', 'alubias',
  'guisantes secos', 'soja texturizada',

  // CONSERVAS
  'tomate triturado', 'tomate frito', 'tomate natural pelado', 'tomate concentrado',
  'atun en aceite', 'atun al natural', 'sardinas aceite', 'boniato aceite',
  'mejillones escabeche', 'berberechos', 'anchoas', 'salmon ahumado',
  'maiz cocido', 'pimientos piquillo', 'alcachofas', 'esparragos lata',
  'champiñones lata',

  // SALSAS Y CONDIMENTOS
  'ketchup', 'mayonesa', 'mostaza', 'salsa de soja', 'salsa barbacoa',
  'salsa brava', 'alioli', 'tabasco', 'salsa worcestershire',
  'sal fina', 'sal gruesa', 'pimienta negra molida', 'pimenton dulce',
  'pimenton picante', 'oregano', 'comino', 'curry', 'canela molida',
  'nuez moscada', 'azafran', 'laurel', 'tomillo', 'romero',
  'ajo en polvo', 'cebolla en polvo', 'mezcla especias', 'colorante alimentario',

  // AZÚCAR, CAFÉ Y DESAYUNO
  'azucar blanca', 'azucar morena', 'azucar glas', 'edulcorante',
  'cafe molido', 'cafe grano', 'cafe soluble', 'cafe capsulas',
  'te negro', 'te verde', 'te manzanilla', 'te poleo', 'infusiones',
  'cacao soluble', 'chocolate negro', 'chocolate con leche', 'nocilla',
  'cereales copos maiz', 'cereales integrales', 'muesli', 'copos avena',
  'galletas maria', 'galletas digestive', 'galletas chocolate',
  'bolleria industrial', 'donuts',

  // CARNE Y CHARCUTERÍA
  'pechuga pollo filetes', 'pechuga pollo entera', 'contramuslo pollo',
  'pollo entero', 'alitas pollo',
  'carne picada ternera', 'carne picada mixta', 'filetes ternera',
  'lomo cerdo', 'chuletas cerdo', 'costillas cerdo', 'magro cerdo',
  'jamon cocido', 'jamon serrano', 'pavo cocido', 'chorizo', 'salchichon',
  'fuet', 'mortadela', 'morcilla', 'salchichas frankfurt', 'bacon',

  // PESCADO Y MARISCOS
  'salmon fresco', 'merluza filetes', 'bacalao salado', 'bacalao desalado',
  'dorada entera', 'lubina entera', 'gambas congeladas', 'mejillones frescos',
  'calamares limpios', 'sepia', 'pulpo cocido',
  'palitos cangrejo', 'surimi',

  // FRUTAS Y VERDURAS FRESCAS
  'tomates rama', 'tomates cherry', 'tomates pera',
  'lechuga iceberg', 'lechuga romana', 'mezcla ensalada',
  'cebollas', 'ajos', 'pimientos rojos', 'pimientos verdes', 'pimientos amarillos',
  'zanahorias', 'patatas', 'patatas nuevas', 'boniatos',
  'calabacin', 'berenjena', 'brocoli', 'coliflor', 'repollo',
  'espinacas frescas', 'acelgas', 'judias verdes', 'esparragos frescos',
  'champiñones frescos', 'puerros', 'apio',
  'manzanas golden', 'manzanas fuji', 'peras conferencia',
  'naranjas mesa', 'mandarinas', 'limones',
  'platanos', 'fresas', 'melocoton', 'nectarinas', 'ciruelas',
  'uvas blancas', 'uvas tintas', 'kiwi', 'mango', 'piña natural',
  'sandía', 'melón',

  // CONGELADOS
  'guisantes congelados', 'judias verdes congeladas', 'menestra congelada',
  'espinacas congeladas', 'patatas fritas congeladas', 'croquetas congeladas',
  'pizza congelada', 'lasaña congelada',

  // BEBIDAS
  'agua mineral 1.5l', 'agua mineral 5l', 'agua con gas',
  'zumo naranja', 'zumo manzana', 'zumo multivitaminas',
  'cerveza lager', 'cerveza sin alcohol', 'cerveza rubia pack',
  'vino tinto joven', 'vino blanco', 'vino rosado', 'cava',
  'refresco cola', 'refresco naranja', 'refresco limon', 'refresco sin azucar',
  'agua tonica', 'batido chocolate', 'batido fresa',

  // LIMPIEZA Y HOGAR
  'detergente lavadora liquido', 'detergente lavadora polvo', 'suavizante ropa',
  'lejia', 'limpiahogar multiusos', 'limpiacristales', 'limpiador baño',
  'limpiador cocina', 'quitagrasas', 'friegasuelos',
  'bayetas', 'estropajo', 'guantes goma', 'bolsas basura',
  'papel aluminio', 'papel film', 'bolsas congelacion',
  'papel cocina', 'servilletas', 'papel higienico',

  // HIGIENE PERSONAL
  'gel ducha', 'champu', 'acondicionador', 'jabon manos liquido',
  'pasta de dientes', 'cepillo dientes', 'enjuague bucal',
  'desodorante', 'colonia', 'crema hidratante', 'crema solar',
  'maquinilla afeitar', 'espuma afeitar', 'compresas', 'tampones',
  'pañuelos papel', 'algodon',
];

// BLOQUE B: 250 productos catálogo ampliado
const TERMINOS_CATALOGO = [
  // LÁCTEOS PREMIUM Y ALTERNATIVOS
  'bebida avena', 'bebida almendra', 'bebida soja', 'bebida arroz',
  'kefir', 'queso ricotta', 'queso parmesano', 'queso azul',
  'mantequilla sin sal', 'ghee', 'nata agria', 'creme fraiche',
  'helado vainilla', 'helado chocolate', 'helado fresa',

  // PANADERÍA Y BOLLERÍA ESPECIAL
  'pan centeno', 'pan espelta', 'pan semillas', 'pan sin gluten',
  'tortitas maiz', 'tortillas trigo', 'pita', 'wraps',
  'brioche', 'panettone', 'roscón', 'churros', 'porras',

  // FRUTOS SECOS Y SNACKS
  'almendras crudas', 'almendras tostadas', 'nueces', 'avellanas',
  'pistachos', 'anacardos', 'cacahuetes', 'mix frutos secos',
  'pasas', 'orejones', 'datiles', 'arandanos secos',
  'palomitas maiz', 'patatas fritas bolsa', 'ganchitos', 'nachos',
  'tortitas arroz', 'barritas cereales', 'barritas proteinas',

  // PASTA Y CEREALES ESPECIALES
  'quinoa', 'bulgur', 'cuscus', 'trigo sarraceno', 'amaranto',
  'pasta sin gluten', 'arroz salvaje', 'arroz tres delicias',
  'polenta', 'harina maiz', 'harina avena', 'salvado trigo',

  // SALSAS INTERNACIONALES
  'pesto', 'hummus', 'guacamole', 'tzatziki',
  'salsa teriyaki', 'salsa thai', 'pasta de curry',
  'concentrado de tomate', 'salsa marinara', 'salsa carbonara',

  // PRODUCTOS INTERNACIONALES
  'tortillas mexicanas', 'fajitas kit', 'tacos kit',
  'salsa de ostras', 'aceite sesamo', 'miso pasta',
  'fideos arroz', 'noodles', 'ramen', 'sushi arroz',
  'leche de coco', 'pasta de cacahuete',

  // CARNE PREMIUM Y ALTERNATIVAS
  'solomillo ternera', 'entrecot ternera', 'rosbif',
  'pato pechuga', 'cordero chuletas', 'conejo entero',
  'burguer meat', 'carne hamburguesa', 'hamburguesa vegetal',
  'salchichas frescas', 'longaniza', 'butifarra',
  'jamon iberico', 'lomo iberico', 'salchichon iberico',

  // PESCADO ESPECIAL
  'trucha filetes', 'panga filetes', 'rape', 'rape cola',
  'langostinos cocidos', 'langostinos crudos', 'cigalas',
  'almejas', 'navajas', 'vieiras',
  'huevas bacalao', 'ceviche', 'sushi salmon',

  // VERDURAS Y FRUTAS ESPECIALES
  'aguacate', 'maiz fresco', 'alcachofas frescas', 'hinojo',
  'remolacha cocida', 'lombarda', 'col kale',
  'rúcula', 'canónigos', 'brotes tiernos', 'berros',
  'tomates secos', 'pimientos asados', 'aceitunas negras', 'aceitunas verdes',
  'alcaparras', 'pepinillos', 'cebolletas encurtidas',
  'papaya', 'maracuya', 'granada', 'higos',
  'frutos rojos mix', 'arandanos frescos', 'frambuesas', 'moras',
  'cerezas', 'albaricoques', 'higos secos',

  // PLATOS PREPARADOS
  'gazpacho brick', 'salmorejo brick', 'caldo pollo brick',
  'caldo verduras brick', 'caldo pescado brick',
  'cocido madrileño', 'fabada asturiana', 'lentejas guisadas',
  'paella congelada', 'arroz con leche', 'crema verduras',
  'pure patatas', 'tortilla patatas lista',

  // REPOSTERÍA Y HORNEADO
  'azucar vainillado', 'bicarbonato', 'gasificante', 'cremor tartaro',
  'cacao puro', 'chocolate fondant', 'virutas chocolate',
  'almendras molidas', 'coco rallado', 'semillas chia',
  'semillas lino', 'semillas amapola', 'semillas sesamo',
  'miel', 'mermelada fresa', 'mermelada melocoton', 'mermelada naranja',
  'confitura arandanos', 'crema avellanas', 'tahini',

  // BEBIDAS ESPECIALES
  'zumo tomate', 'zumo piña', 'nectar melocoton',
  'limonada', 'horchata', 'orxata', 'agua coco',
  'kombucha', 'kefir bebible', 'smoothie frutas',
  'vino tinto crianza', 'vino tinto reserva', 'ribera duero',
  'rioja', 'albariño', 'verdejo',
  'cerveza artesana', 'cerveza negra', 'sidra natural',
  'whisky', 'ron', 'ginebra', 'vodka', 'brandy',
  'licor cafe', 'crema whisky', 'vermut',
  'cafe con leche brick', 'te frio lemon', 'te frio melocoton',
  'energy drink', 'isotonica bebida',

  // DIETÉTICA Y SALUD
  'proteina whey', 'proteina vegana', 'creatina',
  'multivitaminico', 'vitamina C', 'vitamina D',
  'omega 3', 'magnesio', 'probioticos',
  'product dietético', 'barrita proteica',
  'avena instantanea', 'granola', 'semillas mezcla',

  // MASCOTAS
  'pienso perro adulto', 'pienso gato adulto', 'pienso perro cachorro',
  'comida humeda perro', 'comida humeda gato',
  'snacks perro', 'arena gato', 'antiparasitario',

  // MENAJE Y VARIOS
  'papel horno', 'capsulas cafe compatibles',
  'filtros cafe', 'azucar caña',
  'agua oxigenada', 'alcohol 96', 'alcohol 70',
  'tiritas', 'gasas', 'esparadrapo',
  'pilas aa', 'pilas aaa',
  'velas', 'ambientador spray', 'ambientador solido',
  'suavizante intenso', 'quitamanchas', 'lavavajillas liquido',
  'pastillas lavavajillas', 'sal lavavajillas',
];

const TODOS_TERMINOS = [...TERMINOS_ESENCIALES, ...TERMINOS_CATALOGO];

// ============================================================
// LLAMADA A APIFY
// ============================================================
async function llamarApify(actorId, input, timeout = 120) {
  const url = `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items`;
  const params = new URLSearchParams({ token: APIFY_TOKEN, timeout, memory: 256 });

  const res = await fetch(`${url}?${params}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout((timeout + 15) * 1000)
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} — ${actorId}`);
  const items = await res.json();
  console.log(`  ✓ ${actorId}: ${items.length} items`);
  return items;
}

// ============================================================
// NORMALIZACIÓN
// ============================================================
function precio(v) {
  if (typeof v === 'number') return Math.round(v * 100) / 100;
  if (typeof v === 'string') return Math.round(parseFloat(v.replace(',', '.').replace(/[^\d.]/g, '')) * 100) / 100 || 0;
  if (v && typeof v === 'object') return precio(v.unit_price || v.price || v.current || 0);
  return 0;
}

const MAPA_CATS = {
  lacteo:'Lácteos', leche:'Lácteos', yogur:'Lácteos', queso:'Lácteos', huevo:'Lácteos', mantequilla:'Lácteos', nata:'Lácteos',
  aceite:'Aceites', vinagre:'Aceites',
  arroz:'Cereales y pasta', pasta:'Cereales y pasta', macarron:'Cereales y pasta', espagueti:'Cereales y pasta', harina:'Cereales y pasta', cereal:'Cereales y pasta', avena:'Cereales y pasta',
  lenteja:'Legumbres', garbanzo:'Legumbres', alubia:'Legumbres', judia:'Legumbres',
  pan:'Panadería', tostada:'Panadería', bizcocho:'Panadería', galleta:'Panadería', magdalena:'Panadería', bolleria:'Panadería',
  tomate:'Conservas', atun:'Conservas', sardina:'Conservas', mejillon:'Conservas', conserva:'Conservas',
  pollo:'Carne', ternera:'Carne', cerdo:'Carne', carne:'Carne', jamon:'Charcutería', chorizo:'Charcutería', salchich:'Charcutería', bacon:'Charcutería', pavo:'Charcutería',
  salmon:'Pescado', merluza:'Pescado', bacalao:'Pescado', gamba:'Pescado', marisco:'Pescado', pescado:'Pescado',
  manzana:'Frutas', pera:'Frutas', naranja:'Frutas', platano:'Frutas', fresa:'Frutas', uva:'Frutas', kiwi:'Frutas', fruta:'Frutas', melon:'Frutas', sandia:'Frutas',
  tomate:'Verduras', lechuga:'Verduras', cebolla:'Verduras', zanahoria:'Verduras', patata:'Verduras', pimiento:'Verduras', calabacin:'Verduras', verdura:'Verduras', ensalada:'Verduras',
  guisante:'Congelados', croqueta:'Congelados', pizza:'Congelados', congelado:'Congelados',
  agua:'Bebidas', cerveza:'Bebidas', vino:'Bebidas', zumo:'Bebidas', refresco:'Bebidas', cola:'Bebidas', batido:'Bebidas', cafe:'Bebidas',
  cafe:'Café e infusiones', te:'Café e infusiones', infusion:'Café e infusiones', manzanilla:'Café e infusiones',
  detergente:'Limpieza', lejia:'Limpieza', limpiad:'Limpieza', suavizante:'Limpieza', bayeta:'Limpieza', fregasuelos:'Limpieza',
  gel:'Higiene', champu:'Higiene', jabon:'Higiene', dental:'Higiene', desodorante:'Higiene', compresas:'Higiene',
  papel:'Papel y hogar', servilleta:'Papel y hogar', bolsa:'Papel y hogar', aluminio:'Papel y hogar',
  azucar:'Dulces y repostería', miel:'Dulces y repostería', mermelada:'Dulces y repostería', chocolate:'Dulces y repostería',
  fruto:'Frutos secos', almendra:'Frutos secos', nuez:'Frutos secos', pistacho:'Frutos secos',
  aperitivo:'Aperitivos', patatas:'Aperitivos', nachos:'Aperitivos', palomitas:'Aperitivos',
  pienso:'Mascotas', gato:'Mascotas', perro:'Mascotas', arena:'Mascotas',
};

function categoria(nombre = '', catRaw = '') {
  const t = (nombre + ' ' + catRaw).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [k, v] of Object.entries(MAPA_CATS)) if (t.includes(k)) return v;
  return 'Otros';
}

function normalizar(items, super_, mapFn) {
  return items.map(mapFn).filter(p => p.nombre && p.precio > 0).map(p => ({ ...p, supermercado: super_ }));
}

const mapMercadona = item => ({
  nombre: (item.display_name || item.name || '').trim(),
  precio: precio(item.price_instructions?.unit_price || item.price),
  imagen: item.thumbnail || '',
  url: item.share_url || 'https://tienda.mercadona.es',
  categoria: categoria(item.display_name, item.categories?.[0]?.name)
});

const mapCarrefour = item => ({
  nombre: (item.name || item.title || '').trim(),
  precio: precio(item.price || item.currentPrice),
  imagen: item.image || item.imageUrl || '',
  url: item.url || 'https://www.carrefour.es',
  categoria: categoria(item.name, item.category)
});

const mapLidl = item => ({
  nombre: (item.name || item.title || '').trim(),
  precio: precio(item.price || item.currentPrice),
  imagen: item.image || item.thumbnail || '',
  url: item.url || 'https://www.lidl.es',
  categoria: categoria(item.name, item.category)
});

const mapAldi = item => ({
  nombre: (item.name || item.title || '').trim(),
  precio: precio(item.price || item.currentPrice),
  imagen: item.image || item.imageUrl || '',
  url: item.url || 'https://www.aldi.es',
  categoria: categoria(item.name, item.category)
});

const mapEroski = item => ({
  nombre: (item.name || item.title || '').trim(),
  precio: precio(item.price || item.currentPrice),
  imagen: item.image || item.imageUrl || '',
  url: item.url || 'https://supermercado.eroski.es',
  categoria: categoria(item.name, item.category)
});

// ============================================================
// AGRUPACIÓN
// ============================================================
function clave(nombre) {
  return nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '').replace(/\b(de|la|el|los|las|un|una|con|sin|para|del)\b/g, '')
    .replace(/\s+/g, ' ').trim().split(' ').slice(0, 3).join('_');
}

function agrupar(todos) {
  const mapa = new Map();
  for (const p of todos) {
    const k = clave(p.nombre);
    if (!mapa.has(k)) {
      mapa.set(k, { id: k, nombre: p.nombre, categoria: p.categoria, imagen: p.imagen, urls: {}, precios: {} });
    }
    const g = mapa.get(k);
    g.precios[p.supermercado] = p.precio;
    g.urls[p.supermercado] = p.url;
    if (!g.imagen && p.imagen) g.imagen = p.imagen;
  }
  return Array.from(mapa.values())
    .filter(g => Object.keys(g.precios).length >= 1)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('🛒 EcoCesta — Actualizando precios (5 supermercados)');
  console.log(`📅 ${new Date().toLocaleString('es-ES')}\n`);

  const errores = {};

  const [rM, rC, rL, rA, rE] = await Promise.allSettled([
    llamarApify(ACTORS.mercadona, { postalCode: '28001', maxItems: 500 }),
    llamarApify(ACTORS.carrefour, { search: TODOS_TERMINOS, maxItems: 500, country: 'ES' }),
    llamarApify(ACTORS.lidl,      { searchTerms: TODOS_TERMINOS, maxItems: 500, country: 'ES' }),
    llamarApify(ACTORS.aldi,      { searchTerms: TODOS_TERMINOS, maxItems: 500, country: 'ES' }),
    llamarApify(ACTORS.eroski,    { searchTerms: TODOS_TERMINOS, maxItems: 300, country: 'ES' }),
  ]);

  const ok = (r, super_, mapFn) => r.status === 'fulfilled'
    ? normalizar(r.value, super_, mapFn)
    : (errores[super_] = r.reason?.message, []);

  const mercadona = ok(rM, 'Mercadona', mapMercadona);
  const carrefour = ok(rC, 'Carrefour', mapCarrefour);
  const lidl      = ok(rL, 'Lidl',      mapLidl);
  const aldi      = ok(rA, 'Aldi',      mapAldi);
  const eroski    = ok(rE, 'Eroski',    mapEroski);

  if (Object.keys(errores).length) {
    console.warn('\n⚠️  Errores:');
    for (const [s, e] of Object.entries(errores)) console.warn(`   ${s}: ${e}`);
  }

  const productos = agrupar([...mercadona, ...carrefour, ...lidl, ...aldi, ...eroski]);

  console.log(`\n📦 Productos únicos: ${productos.length}`);
  console.log(`   Mercadona:${mercadona.length} | Carrefour:${carrefour.length} | Lidl:${lidl.length} | Aldi:${aldi.length} | Eroski:${eroski.length}`);

  const salida = {
    actualizadoEn: new Date().toISOString(),
    totalProductos: productos.length,
    supermercados: ['Mercadona', 'Carrefour', 'Lidl', 'Aldi', 'Eroski'],
    fuentes: { Mercadona: mercadona.length, Carrefour: carrefour.length, Lidl: lidl.length, Aldi: aldi.length, Eroski: eroski.length },
    errores,
    productos
  };

  mkdirSync(new URL('../public', import.meta.url).pathname, { recursive: true });
  writeFileSync(new URL('../public/precios.json', import.meta.url).pathname, JSON.stringify(salida, null, 2), 'utf-8');
  console.log('\n✅ public/precios.json actualizado');

  if (Object.keys(errores).length === 5) { console.error('❌ Todos los supers fallaron.'); process.exit(1); }
}

main().catch(e => { console.error(e); process.exit(1); });
