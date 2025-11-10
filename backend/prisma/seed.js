const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const categories = [
    'Caramelos',
    'Gomitas',
    'Chocolate',
    'Alfajores',
    'Golosinas',
    'Snacks',
    'Galletas',
  ];

  // Upsert categorías por nombre
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Productos de ejemplo (precios en pesos * 100 → cents)
  // Asignamos imágenes que coincidan con título y categoría
  const products = [
    { title: 'Caramelos Frutales', description: 'Caramelos con sabores frutales.', price: 1200, image: '/img/caramelos3.jpg', category: 'Caramelos' },
    { title: 'Gomitas Ácidas', description: 'Gomitas con un toque ácido.', price: 1500, image: '/img/gomitas2.jpg', category: 'Gomitas' },
    { title: 'Chocolate con leche', description: 'Tableta de chocolate con leche cremoso.', price: 2000, image: '/img/chocolate1.jpg', category: 'Chocolate' },
    { title: 'Alfajores Clásicos', description: 'Alfajores clásicos con dulce de leche.', price: 1800, image: '/img/golosina4.jpg', category: 'Alfajores' },
    { title: 'Bombones Surtidos', description: 'Surtido de bombones rellenos.', price: 2500, image: '/img/destacado-golosina2.jpg', category: 'Chocolate' },
    { title: 'Chicles Frutales', description: 'Chicles sabor a frutas.', price: 800, image: '/img/golosina6.jpg', category: 'Golosinas' },
    // Extras de prueba
    { title: 'Caramelos Masticables', description: 'Caramelos masticables suaves.', price: 1100, image: '/img/dulce1.jpg', category: 'Caramelos' },
    { title: 'Gomitas de Ositos', description: 'Gomitas con forma de ositos.', price: 1600, image: '/img/golosina2.jpg', category: 'Gomitas' },
    { title: 'Chocolate Amargo 70%', description: 'Tableta de chocolate amargo 70% cacao.', price: 2300, image: '/img/chocolate1.jpg', category: 'Chocolate' },
    { title: 'Alfajores de Maicena', description: 'Alfajores de maicena con coco.', price: 1900, image: '/img/golosina5.jpg', category: 'Alfajores' },
    { title: 'Mentitas', description: 'Caramelos sabor menta.', price: 900, image: '/img/dulce2.jpg', category: 'Caramelos' },
    { title: 'Rocklets', description: 'Grageas de chocolate con colores.', price: 1800, image: '/img/dulce3.jpg', category: 'Chocolate' },
    { title: 'Paletas Multisabor', description: 'Paletas clásicas de diversos sabores.', price: 700, image: '/img/caramelos3.jpg', category: 'Caramelos' },
    { title: 'Galletitas Dulces', description: 'Galletitas dulces crocantes.', price: 1000, image: '/img/golosina3.jpg', category: 'Galletas' },
    { title: 'Praliné de Maní', description: 'Maní acaramelado crocante.', price: 900, image: '/img/dulce4.jpg', category: 'Snacks' },
    // Nuevos adicionales
    { title: 'Caramelos de Dulce de Leche', description: 'Caramelos sabor dulce de leche.', price: 1300, image: '/img/dulce1.jpg', category: 'Caramelos' },
    { title: 'Gomitas Surtidas', description: 'Surtido de gomitas frutales.', price: 1550, image: '/img/gomitas2.jpg', category: 'Gomitas' },
    { title: 'Chocolate con Almendras', description: 'Chocolate con leche y trozos de almendras.', price: 2400, image: '/img/chocolate1.jpg', category: 'Chocolate' },
    { title: 'Alfajores Triples', description: 'Alfajores triples bañados en chocolate.', price: 2100, image: '/img/golosina4.jpg', category: 'Alfajores' },
    { title: 'Alfajores Bañados', description: 'Bañados en chocolate con relleno clásico.', price: 2000, image: '/img/golosina5.jpg', category: 'Alfajores' },
    { title: 'Galletitas de Chocolate', description: 'Cookies crocantes con chispas.', price: 1200, image: '/img/golosina3.jpg', category: 'Galletas' },
    { title: 'Pastillas de Menta', description: 'Pastillas refrescantes de menta.', price: 800, image: '/img/dulce2.jpg', category: 'Caramelos' },
    { title: 'Chicles de Menta', description: 'Chicles con intenso sabor a menta.', price: 850, image: '/img/golosina6.jpg', category: 'Golosinas' },
    { title: 'Bombones de Licor', description: 'Surtido de bombones con licor.', price: 2700, image: '/img/destacado-golosina2.jpg', category: 'Chocolate' },
    { title: 'Caramelos Duros', description: 'Caramelos duros tradicionales.', price: 900, image: '/img/caramelos3.jpg', category: 'Caramelos' },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { title: p.title } });
    const data = {
      title: p.title,
      description: p.description,
      priceCents: Math.round(p.price * 100),
      image: p.image,
      category: { connect: { name: p.category } },
    };
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data });
    } else {
      await prisma.product.create({ data });
    }
  }

  const totalCategories = await prisma.category.count();
  const totalProducts = await prisma.product.count();
  console.log(`Seed completo. Categorías: ${totalCategories}, Productos: ${totalProducts}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
