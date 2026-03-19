import { api } from '@/lib/axios';
import { API_PATH } from '@/constants/api-path';
import { OnboardingRequest } from '../types/onboarding.types';
import {
  WineType,
  WineFlavor,
  DrinkingSituation,
  PreferenceUpdateRequest,
} from '../types/preference.types';
import { TasteData } from '@/features/wine/components/TasteProfileForm';

/**
 * 프론트엔드 라벨 -> 백엔드 Enum 매핑
 */
const MAPPINGS = {
  WINE_TYPES: {
    레드: 'RED',
    화이트: 'WHITE',
    로제: 'ROSE',
    스파클링: 'SPARKLING',
    디저트: 'DESSERT',
    주정강화: 'FORTIFIED',
  } as Record<string, WineType>,

  FLAVORS: {
    과일향: 'FRUIT',
    꽃향: 'FLOWER',
    베리향: 'BERRY',
    스파이스: 'SPICE',
    오크: 'OAK',
  } as Record<string, WineFlavor>,

  SITUATIONS: {
    선물: 'GIFT',
    혼술: 'ALONE',
    집들이: 'HOUSEWARMING',
    모임: 'PARTY',
    데이트: 'DATE',
    가족모임: 'FAMILY',
  } as Record<string, DrinkingSituation>,
};

export const onboardingApi = {
  /**
   * 온보딩/취향 정보 patch 요청 (PATCH /api/preferences)
   */
  submitOnboarding: async (data: TasteData): Promise<void> => {
    const request: PreferenceUpdateRequest = {
      sweetness: data.tastes.sweet,
      acidity: data.tastes.acid,
      body: data.tastes.body,
      tannin: data.tastes.tannin,
      abv: [5, 10, 15, 20, 25][data.tastes.abv - 1] || 15,

      preferredTypes: data.selectedWineTypes
        .map((label) => MAPPINGS.WINE_TYPES[label])
        .filter((val): val is WineType => !!val),

      preferredFlavors: data.selectedFlavorTags
        .map((label) => MAPPINGS.FLAVORS[label])
        .filter((val): val is WineFlavor => !!val),

      drinkingSituations: data.selectedSituations
        .map((label) => MAPPINGS.SITUATIONS[label])
        .filter((val): val is DrinkingSituation => !!val),
    };

    const { data: responseData } = await api.patch(API_PATH.USER.PREFERENCES, request);
    return responseData;
  },

  submit: (data: OnboardingRequest) =>
    api.post(API_PATH.USER.ONBOARDING, data).then((res) => res.data),
};
