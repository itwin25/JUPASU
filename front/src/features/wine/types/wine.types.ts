export type WineType = 'RED' | 'WHITE' | 'ROSE' | 'SPARKLING' | 'DESSERT';

export interface Wine {
  id: number;
  name: string;
  origin: string;
  price: number;
  type: WineType;
  imageUrl: string;
  rating: number;
  taste: {
    sweetness: number;
    acidity: number;
    tannin: number;
    body: number;
  };
}

export interface WineListParams {
  page?: number;
  size?: number;
  type?: WineType;
  sort?: string;
}
