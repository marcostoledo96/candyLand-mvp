/** Demo fixtures aligned with backend/prisma/seed.js (prices already in cents). */

export const MOCK_CATEGORIES = [
  { id: 1, name: 'Caramelos', slug: 'caramelos', active: true },
  { id: 2, name: 'Gomitas', slug: 'gomitas', active: true },
  { id: 3, name: 'Chocolate', slug: 'chocolate', active: true },
  { id: 4, name: 'Alfajores', slug: 'alfajores', active: true },
  { id: 5, name: 'Golosinas', slug: 'golosinas', active: true },
  { id: 6, name: 'Snacks', slug: 'snacks', active: true },
  { id: 7, name: 'Galletas', slug: 'galletas', active: true },
];

/** @type {Array<{id:number,title:string,description:string,priceCents:number,imageUrl:string,hoverImageUrl:string|null,stock:number,active:boolean,categoryId:number}>} */
export const MOCK_PRODUCTS = [
  { id: 1, title: 'Caramelos Frutales', description: 'Caramelos con sabores frutales.', priceCents: 120000, imageUrl: '/img/caramelos3.jpg', hoverImageUrl: null, stock: 50, active: true, categoryId: 1 },
  { id: 2, title: 'Gomitas Ácidas', description: 'Gomitas con un toque ácido.', priceCents: 150000, imageUrl: '/img/gomitas2.jpg', hoverImageUrl: null, stock: 40, active: true, categoryId: 2 },
  { id: 3, title: 'Chocolate con leche', description: 'Tableta de chocolate con leche cremoso.', priceCents: 200000, imageUrl: '/img/chocolate1.jpg', hoverImageUrl: null, stock: 30, active: true, categoryId: 3 },
  { id: 4, title: 'Alfajores Clásicos', description: 'Alfajores clásicos con dulce de leche.', priceCents: 180000, imageUrl: '/img/golosina5.jpg', hoverImageUrl: null, stock: 25, active: true, categoryId: 4 },
  { id: 5, title: 'Bombones Surtidos', description: 'Surtido de bombones rellenos.', priceCents: 250000, imageUrl: '/img/destacado-golosina2.jpg', hoverImageUrl: null, stock: 20, active: true, categoryId: 3 },
  { id: 6, title: 'Chicles Frutales', description: 'Chicles sabor a frutas.', priceCents: 80000, imageUrl: '/img/golosinas-hero.jpg', hoverImageUrl: null, stock: 60, active: true, categoryId: 5 },
  { id: 7, title: 'Caramelos Masticables', description: 'Caramelos masticables suaves.', priceCents: 110000, imageUrl: '/img/dulce1.jpg', hoverImageUrl: null, stock: 45, active: true, categoryId: 1 },
  { id: 8, title: 'Gomitas de Ositos', description: 'Gomitas con forma de ositos.', priceCents: 160000, imageUrl: '/img/gomitas2.jpg', hoverImageUrl: null, stock: 35, active: true, categoryId: 2 },
  { id: 9, title: 'Chocolate Amargo 70%', description: 'Tableta de chocolate amargo 70% cacao.', priceCents: 230000, imageUrl: '/img/chocolate1.jpg', hoverImageUrl: null, stock: 15, active: true, categoryId: 3 },
  { id: 10, title: 'Alfajores de Maicena', description: 'Alfajores de maicena con coco.', priceCents: 190000, imageUrl: '/img/dulzura-central.jpg', hoverImageUrl: null, stock: 22, active: true, categoryId: 4 },
  { id: 11, title: 'Mentitas', description: 'Caramelos sabor menta.', priceCents: 90000, imageUrl: '/img/caramelos3.jpg', hoverImageUrl: null, stock: 55, active: true, categoryId: 1 },
  { id: 12, title: 'Rocklets', description: 'Grageas de chocolate con colores.', priceCents: 180000, imageUrl: '/img/destacado-golosina1.jpg', hoverImageUrl: null, stock: 28, active: true, categoryId: 3 },
  { id: 13, title: 'Paletas Multisabor', description: 'Paletas clásicas de diversos sabores.', priceCents: 70000, imageUrl: '/img/caramelos3.jpg', hoverImageUrl: null, stock: 70, active: true, categoryId: 1 },
  { id: 14, title: 'Galletitas Dulces', description: 'Galletitas dulces crocantes.', priceCents: 100000, imageUrl: '/img/golosina6.jpg', hoverImageUrl: null, stock: 18, active: true, categoryId: 7 },
  { id: 15, title: 'Praliné de Maní', description: 'Maní acaramelado crocante.', priceCents: 90000, imageUrl: '/img/dulce4.jpg', hoverImageUrl: null, stock: 32, active: true, categoryId: 6 },
  { id: 16, title: 'Caramelos de Dulce de Leche', description: 'Caramelos sabor dulce de leche.', priceCents: 130000, imageUrl: '/img/dulce1.jpg', hoverImageUrl: null, stock: 48, active: true, categoryId: 1 },
  { id: 17, title: 'Gomitas Surtidas', description: 'Surtido de gomitas frutales.', priceCents: 155000, imageUrl: '/img/gomitas2.jpg', hoverImageUrl: null, stock: 38, active: true, categoryId: 2 },
  { id: 18, title: 'Chocolate con Almendras', description: 'Chocolate con leche y trozos de almendras.', priceCents: 240000, imageUrl: '/img/chocolate1.jpg', hoverImageUrl: null, stock: 12, active: true, categoryId: 3 },
  { id: 19, title: 'Alfajores Triples', description: 'Alfajores triples bañados en chocolate.', priceCents: 210000, imageUrl: '/img/golosina5.jpg', hoverImageUrl: null, stock: 19, active: true, categoryId: 4 },
  { id: 20, title: 'Alfajores Bañados', description: 'Bañados en chocolate con relleno clásico.', priceCents: 200000, imageUrl: '/img/golosina5.jpg', hoverImageUrl: null, stock: 21, active: true, categoryId: 4 },
  { id: 21, title: 'Galletitas de Chocolate', description: 'Cookies crocantes con chispas.', priceCents: 120000, imageUrl: '/img/golosina3.jpg', hoverImageUrl: null, stock: 16, active: true, categoryId: 7 },
  { id: 22, title: 'Pastillas de Menta', description: 'Pastillas refrescantes de menta.', priceCents: 80000, imageUrl: '/img/dulce2.jpg', hoverImageUrl: null, stock: 52, active: true, categoryId: 1 },
  { id: 23, title: 'Chicles de Menta', description: 'Chicles con intenso sabor a menta.', priceCents: 85000, imageUrl: '/img/golosina6.jpg', hoverImageUrl: null, stock: 58, active: true, categoryId: 5 },
  { id: 24, title: 'Bombones de Licor', description: 'Surtido de bombones con licor.', priceCents: 270000, imageUrl: '/img/destacado-golosina2.jpg', hoverImageUrl: null, stock: 10, active: true, categoryId: 3 },
  { id: 25, title: 'Caramelos Duros', description: 'Caramelos duros tradicionales.', priceCents: 90000, imageUrl: '/img/caramelos3.jpg', hoverImageUrl: null, stock: 65, active: true, categoryId: 1 },
];

export const MOCK_BANK = {
  alias: 'candyland.demo',
  cbu: '0000000000000000000001',
  titular: 'CandyLand Demo',
};

export const MOCK_ADMIN = {
  email: 'admin@candyland.demo',
  password: 'demo',
  user: { id: 1, email: 'admin@candyland.demo', name: 'Admin Demo' },
};
