/* ==========================================================================
   LA NUEVA PARISIENNE - RECETARIO MAESTRO Y FÓRMULAS DE PANADERÍA
   Catálogo de recetas artesanales, insumos unitarios y perfiles de horneado
   ========================================================================== */

export const BAKERY_RECIPES = [
  {
    id: 'rec_baguette',
    code: 'PAN-001',
    name: 'Baguette Tradicional Parisina',
    category: 'Panadería Francesa',
    icon: '🥖',
    lucideIcon: 'croissant',
    description: 'Corteza dorada ultracrujiente con greñado tradicional, miga alveolada y fermentación natural con levadura madre.',
    unitWeightGrams: 250,
    defaultQty: 50,
    bakingProfile: {
      temp: 240,
      timeMin: 22,
      ovenType: 'Bóveda de Piedra / Giratorio Industrial',
      steam: 'Vapor inicial abundante (5 segundos)',
      fermentationTime: '18h fermentación lenta en frío (Poolish)',
      damper: 'Cerrado 17 min, abrir últimos 5 min'
    },
    ingredients: [
      { name: 'Harina de Trigo Tradicional T55', matCode: 'MAT-001', qty: 0.160, unit: 'kg', isKey: true },
      { name: 'Agua Filtrada (65% Hidratación)', matCode: null, qty: 0.105, unit: 'L', isKey: false },
      { name: 'Levadura Madre Activa Tostada', matCode: 'MAT-003', qty: 0.0035, unit: 'kg', isKey: true },
      { name: 'Sal Marina Fina', matCode: null, qty: 0.0032, unit: 'kg', isKey: false }
    ],
    steps: [
      { title: 'Autólisis', desc: 'Mezclar la harina T55 con el agua al 65% de hidratación. Dejar reposar 30 minutos para hidratar las proteínas de gluten.' },
      { title: 'Amasado y Fuerza', desc: 'Incorporar la levadura madre y la sal marina; amasar 8 minutos en velocidad 1 y 2 minutos en velocidad 2 hasta obtener una membrana fina traslúcida.' },
      { title: 'Fermentación en Bloque', desc: 'Reposo en cubeta engrasada durante 2 horas a 24°C, realizando dos pliegues (stretch and fold) cada 45 minutos.' },
      { title: 'División y Preformado', desc: 'Dividir en porciones de 350g en crudo, bolear suavemente en cilindros y reposar 20 minutos tapados con lino de panadero.' },
      { title: 'Formado y Greñado', desc: 'Estirar en barras de 55 cm de largo con puntas ahusadas. Colocar en telas de couche. Leudar 75 minutos y realizar 5 cortes oblicuos rápidos con cuchilla.' },
      { title: 'Horneado con Vapor', desc: 'Hornear a 240°C en solera de piedra con inyección de vapor de 5 segundos. Mantener tiro cerrado 17 minutos y abrir los últimos 5 minutos para fijar el crujiente.' }
    ],
    chefTip: 'Para obtener la corteza caramelizada y crujiente parisina, nunca abras el tiro del horno antes de los 17 minutos de cocción.'
  },
  {
    id: 'rec_croissant',
    code: 'PAN-002',
    name: 'Croissant de Mantequilla de Normandía',
    category: 'Bollería Hojaldrada',
    icon: '🥐',
    lucideIcon: 'croissant',
    description: 'Hojaldre fermentado 100% mantequilla de Normandía, alveolado en forma de panal y textura sedosa que se deshace en boca.',
    unitWeightGrams: 75,
    defaultQty: 60,
    bakingProfile: {
      temp: 190,
      timeMin: 16,
      ovenType: 'Convección Fina Industrial',
      steam: 'Sin vapor directo',
      fermentationTime: '2h 30m a 26°C (Cámara controlada)',
      damper: 'Tiro medio'
    },
    ingredients: [
      { name: 'Harina de Trigo Tradicional T55', matCode: 'MAT-001', qty: 0.045, unit: 'kg', isKey: true },
      { name: 'Mantequilla de Normandía 84% M.G.', matCode: 'MAT-002', qty: 0.025, unit: 'kg', isKey: true },
      { name: 'Leche Entera / Agua fría', matCode: null, qty: 0.022, unit: 'L', isKey: false },
      { name: 'Azúcar Fina Refinada', matCode: 'MAT-005', qty: 0.006, unit: 'kg', isKey: true },
      { name: 'Levadura Madre Activa Tostada', matCode: 'MAT-003', qty: 0.002, unit: 'kg', isKey: true },
      { name: 'Huevos Frescos de Granja (Barniz)', matCode: 'MAT-006', qty: 0.1, unit: 'ud', isKey: true },
      { name: 'Sal Marina Fina', matCode: null, qty: 0.001, unit: 'kg', isKey: false }
    ],
    steps: [
      { title: 'Détrempe y Reposo Frío', desc: 'Amasar harina, leche, azúcar, sal y levadura durante 5 minutos. Refrigerar a 4°C en bloque durante 12 horas.' },
      { title: 'Empaste y Laminado', desc: 'Encapsular el bloque de mantequilla al 84% en la masa fría. Dar una vuelta simple y una vuelta doble con 30 minutos de frío entre cada pliegue.' },
      { title: 'Estirado y Corte Preciso', desc: 'Estirar a 3.5 mm de espesor sobre mesa fría. Cortar triángulos isósceles de 9 cm de base por 25 cm de altura.' },
      { title: 'Enrollado y Fermentación', desc: 'Estirar suavemente la punta y enrollar sin presionar. Leudar en cámara a 26°C y 75% humedad durante 2h 30m hasta doblar volumen.' },
      { title: 'Barnizado y Horneado', desc: 'Pincelar dos veces con yema de huevo batida sin tocar los bordes del hojaldre. Hornear a 190°C por 16 minutos hasta un dorado avellana.' }
    ],
    chefTip: 'La temperatura de leudado jamás debe superar los 27°C o la mantequilla de Normandía se fundirá prematuramente destruyendo el laminado.'
  },
  {
    id: 'rec_pain_chocolat',
    code: 'PAN-003',
    name: 'Pain au Chocolat (Chocolatina)',
    category: 'Bollería Hojaldrada',
    icon: '🍫',
    lucideIcon: 'croissant',
    description: 'Hojaldre francés de mantequilla enrollado con dos barras paralelas de chocolate belga oscuro 60% cacao.',
    unitWeightGrams: 85,
    defaultQty: 40,
    bakingProfile: {
      temp: 190,
      timeMin: 16,
      ovenType: 'Convección Fina Industrial',
      steam: 'Sin vapor directo',
      fermentationTime: '2h 30m a 26°C',
      damper: 'Tiro medio'
    },
    ingredients: [
      { name: 'Harina de Trigo Tradicional T55', matCode: 'MAT-001', qty: 0.048, unit: 'kg', isKey: true },
      { name: 'Mantequilla de Normandía 84% M.G.', matCode: 'MAT-002', qty: 0.025, unit: 'kg', isKey: true },
      { name: 'Chocolate Belga 60% Cacao', matCode: 'MAT-004', qty: 0.016, unit: 'kg', isKey: true },
      { name: 'Leche Entera / Agua fría', matCode: null, qty: 0.024, unit: 'L', isKey: false },
      { name: 'Azúcar Fina Refinada', matCode: 'MAT-005', qty: 0.007, unit: 'kg', isKey: true },
      { name: 'Levadura Madre Activa Tostada', matCode: 'MAT-003', qty: 0.002, unit: 'kg', isKey: true },
      { name: 'Huevos Frescos de Granja (Barniz)', matCode: 'MAT-006', qty: 0.1, unit: 'ud', isKey: true },
      { name: 'Sal Marina', matCode: null, qty: 0.001, unit: 'kg', isKey: false }
    ],
    steps: [
      { title: 'Laminado Francés', desc: 'Utilizar masa hojaldrada leudada reposada en frío con mantequilla francesa de alto tenor graso.' },
      { title: 'Corte de Rectángulos', desc: 'Cortar rectángulos exactos de 8 cm de ancho por 14 cm de largo.' },
      { title: 'Inserción de Chocolate', desc: 'Colocar la primera barra de chocolate belga, dar media vuelta a la masa, colocar la segunda barra y terminar de enrollar dejando la unión debajo.' },
      { title: 'Fermentación en Bandeja', desc: 'Disponer sobre bandejas con papel encerado y leudar a 26°C hasta que al tocar vibre ligeramente como un soufflé.' },
      { title: 'Cocción Dorada', desc: 'Pintar con doradura de huevo batido con sal y hornear a 190°C por 16 minutos.' }
    ],
    chefTip: 'Usa chocolate termoresistente con alto porcentaje de manteca de cacao para que no se queme ni se endurezca al enfriar.'
  },
  {
    id: 'rec_brioche',
    code: 'PAN-004',
    name: 'Brioche de Vainilla de Madagascar',
    category: 'Bollería Rica & Dulce',
    icon: '🍞',
    lucideIcon: 'cake',
    description: 'Masa enriquecida con abundante huevo de granja, mantequilla normanda y extracto de vainilla, de miga hilada y suave como una nube.',
    unitWeightGrams: 120,
    defaultQty: 25,
    bakingProfile: {
      temp: 180,
      timeMin: 22,
      ovenType: 'Convección o Giratorio',
      steam: 'Sin vapor',
      fermentationTime: '2h ambiente + 12h reposo en frío a 4°C',
      damper: 'Cerrado'
    },
    ingredients: [
      { name: 'Harina de Trigo Tradicional T55', matCode: 'MAT-001', qty: 0.065, unit: 'kg', isKey: true },
      { name: 'Mantequilla de Normandía 84% M.G.', matCode: 'MAT-002', qty: 0.035, unit: 'kg', isKey: true },
      { name: 'Huevos Frescos de Granja', matCode: 'MAT-006', qty: 0.5, unit: 'ud', isKey: true },
      { name: 'Azúcar Fina Refinada', matCode: 'MAT-005', qty: 0.012, unit: 'kg', isKey: true },
      { name: 'Levadura Madre Activa Tostada', matCode: 'MAT-003', qty: 0.003, unit: 'kg', isKey: true },
      { name: 'Leche Entera', matCode: null, qty: 0.018, unit: 'L', isKey: false },
      { name: 'Extracto de Vainilla y Sal', matCode: null, qty: 0.0012, unit: 'kg', isKey: false }
    ],
    steps: [
      { title: 'Amasado de Masa Rica', desc: 'Mezclar harina, azúcar, sal, levadura, leche, huevos y vainilla durante 10 minutos hasta alcanzar el velo de gluten.' },
      { title: 'Incorporación de Mantequilla', desc: 'Añadir la mantequilla fría en dados poco a poco, amasando hasta que la masa quede sedosa, brillante y despegue de las paredes.' },
      { title: 'Bloque y Maduración en Frío', desc: '1 hora a temperatura ambiente, desgasificar y llevar a refrigeración por 12 horas para solidificar la grasa.' },
      { title: 'Boleado y Modelado', desc: 'Formar Brioche à tête con cabeza hundida o bollos triples en molde de pan dulce.' },
      { title: 'Horneado Brillante', desc: 'Pintar dos veces con huevo y hornear a 180°C por 22 minutos hasta dorado caoba brillante.' }
    ],
    chefTip: 'La mantequilla debe estar fría pero maleable (14°C) y añadirse cuando el gluten ya está 100% desarrollado.'
  },
  {
    id: 'rec_focaccia',
    code: 'PAN-005',
    name: 'Focaccia de Romero y Aceitunas Kalamata',
    category: 'Panadería Mediterránea',
    icon: '🫓',
    lucideIcon: 'wheat',
    description: 'Pan plano de alta hidratación (80%) fermentado con aceite de oliva extra virgen, aceitunas negras maceradas y romero de huerto.',
    unitWeightGrams: 350,
    defaultQty: 20,
    bakingProfile: {
      temp: 230,
      timeMin: 24,
      ovenType: 'Bóveda de Piedra / Giratorio Industrial',
      steam: 'Vapor inicial ligero',
      fermentationTime: '4 horas con plegados coil folds en cubeta',
      damper: 'Cerrado 18 min, luego abrir'
    },
    ingredients: [
      { name: 'Harina de Trigo Tradicional T55', matCode: 'MAT-001', qty: 0.220, unit: 'kg', isKey: true },
      { name: 'Agua Tibia (80% Hidratación)', matCode: null, qty: 0.176, unit: 'L', isKey: false },
      { name: 'Aceite de Oliva Extra Virgen', matCode: null, qty: 0.025, unit: 'L', isKey: false },
      { name: 'Aceitunas Negras y Verdes Kalamata', matCode: null, qty: 0.040, unit: 'kg', isKey: false },
      { name: 'Levadura Madre Activa Tostada', matCode: 'MAT-003', qty: 0.005, unit: 'kg', isKey: true },
      { name: 'Romero Fresco y Flor de Sal', matCode: null, qty: 0.006, unit: 'kg', isKey: false }
    ],
    steps: [
      { title: 'Mezclado de Alta Hidratación', desc: 'Combinar harina y agua al 80% en amasadora espiral. Agregar levadura madre, sal y 15ml de aceite de oliva virgen.' },
      { title: 'Pliegues Coil Folds', desc: 'Efectuar 4 tandas de pliegues en la cubeta cada 30 minutos para dotar a la masa líquida de tensión superficial.' },
      { title: 'Extensión en Bandeja', desc: 'Verter en bandejas de hornear bañadas generosamente con aceite de oliva. Dejar reposar 90 minutos.' },
      { title: 'Hoyuelos y Salmuera', desc: 'Hundir las yemas de los diez dedos en la masa hasta tocar la chapa, creando los alvéolos tradicionales. Rociar salmuera de agua y aceite.' },
      { title: 'Decoración y Horneado', desc: 'Distribuir las aceitunas deshuesadas y hojas frescas de romero. Hornear a 230°C por 24 minutos hasta que la base esté crujiente.' }
    ],
    chefTip: 'La emulsión de agua y aceite vertida antes de entrar al horno mantiene los hoyuelos tiernos mientras la superficie se tuesta dorada.'
  },
  {
    id: 'rec_campesino',
    code: 'PAN-006',
    name: 'Pan Rústico Campesino de Masa Madre (Pain de Campagne)',
    category: 'Panadería Rústica de Autor',
    icon: '🌾',
    lucideIcon: 'wheat',
    description: 'Hogaza de pueblo con mezcla de harina T55 y centeno, fermentación de 24 horas y corteza gruesa y tostada con sabor complejo.',
    unitWeightGrams: 500,
    defaultQty: 30,
    bakingProfile: {
      temp: 240,
      timeMin: 35,
      ovenType: 'Bóveda de Piedra',
      steam: 'Vapor abundante inicial',
      fermentationTime: '24 horas en frío (Banneton)',
      damper: 'Cerrado 20 min, abrir últimos 15 min'
    },
    ingredients: [
      { name: 'Harina de Trigo Tradicional T55', matCode: 'MAT-001', qty: 0.260, unit: 'kg', isKey: true },
      { name: 'Harina Integral de Centeno', matCode: null, qty: 0.060, unit: 'kg', isKey: false },
      { name: 'Agua Filtrada (72% Hidratación)', matCode: null, qty: 0.230, unit: 'L', isKey: false },
      { name: 'Levadura Madre Activa Tostada (Masa Madre)', matCode: 'MAT-003', qty: 0.065, unit: 'kg', isKey: true },
      { name: 'Sal Marina Fina', matCode: null, qty: 0.0065, unit: 'kg', isKey: false }
    ],
    steps: [
      { title: 'Autólisis Completa', desc: 'Mezclar harinas con agua y reposar 45 minutos.' },
      { title: 'Adición de Masa Madre', desc: 'Incorporar la masa madre activa en su punto máximo y la sal marina; amasar hasta red media.' },
      { title: 'Pliegues en Bloque', desc: 'Fermentación en bloque durante 3 horas a 25°C con 3 pliegues.' },
      { title: 'Formado en Banneton', desc: 'Preformar en redondo y formar hogaza rústica. Colocar en cestas banneton enharinadas y madurar en frío a 4°C por 18 horas.' },
      { title: 'Horneado en Solera', desc: 'Volcar directo en piedra refractaria a 240°C con vapor intenso. Hornear 35 minutos hasta sonido hueco en la base.' }
    ],
    chefTip: 'La harina de centeno aporta enzimas amilasas que aceleran la caramelización y profundizan el aroma a cereal tostado.'
  },
  {
    id: 'rec_pan_molde',
    code: 'PAN-007',
    name: 'Pan de Molde Artesanal Suave (Pain de Mie)',
    category: 'Panadería de Mesa',
    icon: '🍞',
    lucideIcon: 'package',
    description: 'Pan de molde rectangular con leche entera y mantequilla, ideal para sándwiches gourmet, tostadas francesas y bocadillos.',
    unitWeightGrams: 600,
    defaultQty: 20,
    bakingProfile: {
      temp: 185,
      timeMin: 30,
      ovenType: 'Convección Industrial',
      steam: 'Sin vapor',
      fermentationTime: '1h 45m en molde tapado',
      damper: 'Cerrado'
    },
    ingredients: [
      { name: 'Harina de Trigo Tradicional T55', matCode: 'MAT-001', qty: 0.350, unit: 'kg', isKey: true },
      { name: 'Mantequilla de Normandía 84% M.G.', matCode: 'MAT-002', qty: 0.045, unit: 'kg', isKey: true },
      { name: 'Leche Entera Tibia', matCode: null, qty: 0.200, unit: 'L', isKey: false },
      { name: 'Azúcar Fina Refinada', matCode: 'MAT-005', qty: 0.020, unit: 'kg', isKey: true },
      { name: 'Levadura Madre Activa Tostada', matCode: 'MAT-003', qty: 0.007, unit: 'kg', isKey: true },
      { name: 'Sal Marina', matCode: null, qty: 0.006, unit: 'kg', isKey: false }
    ],
    steps: [
      { title: 'Amasado Fino', desc: 'Amasar todos los ingredientes excepto la mantequilla por 8 minutos. Incorporar la mantequilla y amasar 5 minutos más.' },
      { title: 'Primera Fermentación', desc: 'Reposo en bloque durante 45 minutos a 26°C.' },
      { title: 'División en 4 Cilindros', desc: 'Dividir en 4 porciones iguales de 150g, enrollar en cilindros y colocarlos contiguos en molde metálico engrasado.' },
      { title: 'Leudado Final', desc: 'Leudar tapado con tapa corredera hasta alcanzar el 85% de la capacidad del molde.' },
      { title: 'Cocción y Desmolde', desc: 'Hornear a 185°C por 30 minutos. Desmoldar de inmediato sobre rejilla de alambre para conservar la corteza tierna.' }
    ],
    chefTip: 'Desmolda el pan tan pronto sale del horno; si lo dejas dentro del molde se creará condensación en la base y quedará gomoso.'
  },
  {
    id: 'rec_eclair_choux',
    code: 'PAS-001',
    name: 'Masa Choux para Éclairs de Chocolate Belga',
    category: 'Pastelería Horneable',
    icon: '⚡',
    lucideIcon: 'sparkles',
    description: 'Pasta choux francesa hueca y ligera, horneada a doble temperatura para lograr volumen uniforme y relleno con chocolate 60%.',
    unitWeightGrams: 90,
    defaultQty: 35,
    bakingProfile: {
      temp: 200,
      timeMin: 25,
      ovenType: 'Convección Digital',
      steam: 'Sin vapor (tiro cerrado 12m, tiro abierto 13m)',
      fermentationTime: 'Sin fermentación (leudado físico por vapor de agua)',
      damper: 'Cerrado al inicio, abierto al final'
    },
    ingredients: [
      { name: 'Harina de Trigo Tradicional T55', matCode: 'MAT-001', qty: 0.022, unit: 'kg', isKey: true },
      { name: 'Mantequilla de Normandía 84% M.G.', matCode: 'MAT-002', qty: 0.018, unit: 'kg', isKey: true },
      { name: 'Huevos Frescos de Granja', matCode: 'MAT-006', qty: 0.6, unit: 'ud', isKey: true },
      { name: 'Chocolate Belga 60% Cacao (Relleno)', matCode: 'MAT-004', qty: 0.025, unit: 'kg', isKey: true },
      { name: 'Leche Entera y Agua', matCode: null, qty: 0.030, unit: 'L', isKey: false },
      { name: 'Azúcar Fina Refinada', matCode: 'MAT-005', qty: 0.002, unit: 'kg', isKey: true },
      { name: 'Sal Fina', matCode: null, qty: 0.0005, unit: 'kg', isKey: false }
    ],
    steps: [
      { title: 'Panada Escaldada', desc: 'Hervir agua, leche, mantequilla, azúcar y sal. Volcar la harina de golpe y secar 2 minutos a fuego vivo.' },
      { title: 'Adición de Huevos', desc: 'Enfriar a 45°C y agregar los huevos batidos poco a poco hasta lograr el punto de pico suave.' },
      { title: 'Escudillado en Manga', desc: 'Con boquilla estriada francesa PF16, trazar bastones rectos de 12 cm sobre tapetes de silicona microperforados.' },
      { title: 'Horneado de Expansión', desc: '12 minutos a 200°C con tiro cerrado para inflar la cavidad interior.' },
      { title: 'Secado Final', desc: 'Bajar a 175°C y abrir el tiro 13 minutos para deshidratar el interior hueco sin que colapse.' }
    ],
    chefTip: 'La boquilla estriada es fundamental para que el éclair crezca regular sin agrietarse ni perder la forma recta.'
  },
  {
    id: 'rec_pan_jamon',
    code: 'PAN-008',
    name: 'Pan de Jamón Tradicional Navideño / Especial',
    category: 'Especialidades de Temporada',
    icon: '🥖',
    lucideIcon: 'utensils',
    description: 'Clásico pan festivo de masa briochada tierna relleno con jamón ahumado, tocineta crujiente, pasas morenas y aceitunas verdes.',
    unitWeightGrams: 950,
    defaultQty: 15,
    bakingProfile: {
      temp: 180,
      timeMin: 38,
      ovenType: 'Convección o Giratorio Industrial',
      steam: 'Sin vapor directo',
      fermentationTime: '1h 30m leudado en bandeja',
      damper: 'Tiro cerrado'
    },
    ingredients: [
      { name: 'Harina de Trigo Tradicional T55', matCode: 'MAT-001', qty: 0.420, unit: 'kg', isKey: true },
      { name: 'Mantequilla de Normandía 84% M.G.', matCode: 'MAT-002', qty: 0.055, unit: 'kg', isKey: true },
      { name: 'Jamón Ahumado Cocido Rebanado', matCode: null, qty: 0.350, unit: 'kg', isKey: false },
      { name: 'Tocineta Ahumada en Tiras', matCode: null, qty: 0.080, unit: 'kg', isKey: false },
      { name: 'Aceitunas Verdes Rellenas', matCode: null, qty: 0.060, unit: 'kg', isKey: false },
      { name: 'Pasas Morenas / Rubias', matCode: null, qty: 0.050, unit: 'kg', isKey: false },
      { name: 'Huevos Frescos de Granja', matCode: 'MAT-006', qty: 1.0, unit: 'ud', isKey: true },
      { name: 'Leche Entera', matCode: null, qty: 0.160, unit: 'L', isKey: false },
      { name: 'Azúcar Fina Refinada', matCode: 'MAT-005', qty: 0.035, unit: 'kg', isKey: true },
      { name: 'Levadura Madre Activa Tostada', matCode: 'MAT-003', qty: 0.012, unit: 'kg', isKey: true }
    ],
    steps: [
      { title: 'Amasado Suave', desc: 'Amasar harina, leche, levadura, azúcar, huevos y mantequilla hasta textura elástica y sedosa. Reposar 30 minutos.' },
      { title: 'Estirado Rectangular', desc: 'Estirar con rodillo en rectángulo uniforme de 40 x 30 cm de 5 mm de grosor. Pintar con mantequilla derretida.' },
      { title: 'Hilera de Aceitunas y Relleno', desc: 'Colocar una hilera compacta de aceitunas en un borde para enrollar el centro. Cubrir con jamón, tocineta y pasas.' },
      { title: 'Enrollado y Pinchado', desc: 'Enrollar con firmeza. Pinchar con tenedor hasta el fondo en varias hileras para que libere los gases de cocción.' },
      { title: 'Leudado y Horneado Dorado', desc: 'Leudar 1 hora. Barnizar con huevo y papelón. Hornear a 180°C durante 38 minutos hasta dorado caoba.' }
    ],
    chefTip: 'Pinchar la masa con tenedor hasta la base evita que se abran bolsas de vapor internas que despeguen la corteza del relleno.'
  },
  {
    id: 'rec_quiche_lorraine',
    code: 'ESP-002',
    name: 'Quiche Lorraine de Panadería (Tartaleta)',
    category: 'Salados & Especialidades',
    icon: '🥧',
    lucideIcon: 'utensils',
    description: 'Tartaleta salada con base de masa quebrada brisée de mantequilla, tocineta ahumada, queso gruyère y suave crema Royale.',
    unitWeightGrams: 220,
    defaultQty: 16,
    bakingProfile: {
      temp: 190,
      timeMin: 28,
      ovenType: 'Convección Fina Industrial',
      steam: 'Sin vapor',
      fermentationTime: 'Sin fermentación (reposo de masa brisée en frío 1h)',
      damper: 'Tiro medio'
    },
    ingredients: [
      { name: 'Harina de Trigo Tradicional T55', matCode: 'MAT-001', qty: 0.065, unit: 'kg', isKey: true },
      { name: 'Mantequilla de Normandía 84% M.G.', matCode: 'MAT-002', qty: 0.035, unit: 'kg', isKey: true },
      { name: 'Huevos Frescos de Granja', matCode: 'MAT-006', qty: 0.8, unit: 'ud', isKey: true },
      { name: 'Crema de Leche / Nata 35% M.G.', matCode: null, qty: 0.065, unit: 'L', isKey: false },
      { name: 'Tocino Ahumado Salteado', matCode: null, qty: 0.045, unit: 'kg', isKey: false },
      { name: 'Queso Gruyère Rallado', matCode: null, qty: 0.030, unit: 'kg', isKey: false },
      { name: 'Sal Marina y Nuez Moscada', matCode: null, qty: 0.0015, unit: 'kg', isKey: false }
    ],
    steps: [
      { title: 'Arenado de Masa Brisée', desc: 'Arenar harina con mantequilla fría cortada en cubitos. Añadir agua helada y unir sin amasar para evitar ligazón.' },
      { title: 'Reposo en Frío', desc: 'Envolver en film y refrigerar por 1 hora a 4°C.' },
      { title: 'Forrado y Precocción', desc: 'Estirar a 3 mm, forrar moldes acanalados de quiche y precocer en blanco con pesos a 180°C durante 10 minutos.' },
      { title: 'Aparejo Royale', desc: 'Batir huevos frescos con crema de leche espesa, sal, pimienta negra y una pizca de nuez moscada recién rallada.' },
      { title: 'Montaje y Horneado', desc: 'Repartir el tocino crujiente y el queso en la base, verter el aparejo y hornear a 190°C por 28 minutos hasta suflar dorado.' }
    ],
    chefTip: 'La precocción ciega de la masa quebrada es el secreto indispensable para que la base quede crujiente y no húmeda al recibir la crema.'
  }
];
