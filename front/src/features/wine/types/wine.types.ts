export type WineType = 'RED' | 'WHITE' | 'ROSE' | 'DESSERT' | 'FORTIFIED' | 'SPARKLING';

export interface Wine {
  id: number;
  nameKr: string;
  nameEn: string;
  type: WineType;
  country: string;
  averageRating: number;
  price: number;
  imageUrl: string;
}

export interface WineListParams {
  keyword?: string;
  page?: number;
  size?: number;
  type?: WineType;
  sort?: string;
}

export interface ScrapWine {
  wineId: number;
  scrapId: number;
  wineName: string;
  wineType: string;
  averageRating: number;
  price: number;
  matchRate: number;
  country: string;
  imageUrl: string;
  isScraped: boolean;
}
