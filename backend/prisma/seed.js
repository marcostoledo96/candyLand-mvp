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
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { title: p.title },
      update: {
        description: p.description,
        priceCents: Math.round(p.price * 100),
        image: p.image,
        category: { connect: { name: p.category } },
      },
      create: {
        title: p.title,
        description: p.description,
        priceCents: Math.round(p.price * 100),
        image: p.image,
        category: { connect: { name: p.category } },
      }
    });
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
