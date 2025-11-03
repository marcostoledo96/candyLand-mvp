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
  const products = [
    { title: 'Caramelos Frutales', description: 'Dulces tropicales suaves.', price: 1200, image: '/img/dulce1.jpg', category: 'Caramelos' },
    { title: 'Gomitas Ácidas', description: 'Con un toque ácido y suave.', price: 1500, image: '/img/dulce2.jpg', category: 'Gomitas' },
    { title: 'Chocolate con leche', description: 'Chocolate con leche cremoso.', price: 2000, image: '/img/dulce3.jpg', category: 'Chocolate' },
    { title: 'Alfajores Clásicos', description: 'Clásicos con dulce de leche.', price: 1800, image: '/img/dulce4.jpg', category: 'Alfajores' },
    { title: 'Bombones', description: 'Bombones rellenos variados.', price: 2500, image: '/img/dulce5.jpg', category: 'Chocolate' },
    { title: 'Chicles Frutales', description: 'Sabor a frutas explosivas.', price: 800, image: '/img/dulce6.jpg', category: 'Golosinas' },
  ];

  for (const p of products) {
    const exists = await prisma.product.findFirst({ where: { title: p.title } });
    if (!exists) {
      await prisma.product.create({
        data: {
          title: p.title,
          description: p.description,
          priceCents: Math.round(p.price * 100),
          image: p.image,
          category: { connect: { name: p.category } },
        }
      });
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
