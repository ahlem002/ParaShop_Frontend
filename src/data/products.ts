export interface Product {
  id: string;
  companyName: string;
  title: string;
  price: number;
  rating: number;
}

export const bestSellers: Product[] = [
  {
    id: '1',
    companyName: 'Bio Laboratory',
    title: 'Radiance Serum',
    price: 24.99,
    rating: 4.8,
  },
  {
    id: '2',
    companyName: 'PharmaPure',
    title: 'Moisturizing Cream',
    price: 18.5,
    rating: 4.9,
  },
  {
    id: '3',
    companyName: 'NaturaCare',
    title: 'Essential Oil',
    price: 12.0,
    rating: 4.6,
  },
  {
    id: '4',
    companyName: 'HealthZen',
    title: 'Sleep Supplement',
    price: 29.9,
    rating: 4.7,
  },
];
