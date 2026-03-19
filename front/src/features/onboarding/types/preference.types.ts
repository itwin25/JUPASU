/**
 * 와인 종류 Enum (백엔드 매칭)
 */
export type WineType = 'RED' | 'WHITE' | 'ROSE' | 'DESSERT' | 'FORTIFIED' | 'SPARKLING';

/**
 * 선호 맛/향 Enum (백엔드 매칭)
 */
export type WineFlavor = 'FRUIT' | 'FLOWER' | 'BERRY' | 'SPICE' | 'OAK';

/**
 * 음용 상황 Enum (백엔드 매칭)
 */
export type DrinkingSituation = 'GIFT' | 'ALONE' | 'HOUSEWARMING' | 'PARTY' | 'DATE' | 'FAMILY';

/**
 * 선호 정보 업데이트 요청 DTO
 */
export interface PreferenceUpdateRequest {
  sweetness?: number;
  acidity?: number;
  body?: number;
  tannin?: number;
  abv?: number;
  preferredPriceMin?: number;
  preferredPriceMax?: number;
  preferredTypes?: WineType[];
  preferredFlavors?: WineFlavor[];
  drinkingSituations?: DrinkingSituation[];
}
