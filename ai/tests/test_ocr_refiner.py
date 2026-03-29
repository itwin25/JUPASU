import pytest
from app.services.ocr.refiner import _clean_menu_list, _normalize_whitespace

def test_clean_menu_list_subsumption():
    """
    포괄 관계에 있는 단어 중 파편화된 단어가 제거되는지 테스트합니다.
    """
    input_list = ["감바스", "감바스 알 아히요", "스테이크", "연어 스테이크", "와인"]
    # '감바스'는 '감바스 알 아히요'에 포함되므로 제거되어야 함
    # '스테이크'는 '연어 스테이크'에 포함되므로 제거되어야 함
    expected = ["감바스 알 아히요", "연어 스테이크", "와인"]
    
    result = _clean_menu_list(input_list)
    assert sorted(result) == sorted(expected)

def test_clean_menu_list_whitespace_insensitivity():
    """
    공백 차이가 있어도 중복 및 포괄 관계를 인식하는지 테스트합니다.
    """
    input_list = ["샥슈카 ", "  샥슈카", "토마토 샥슈카"]
    # 모든 '샥슈카' 변종이 '토마토 샥슈카'에 포함되어 제거되어야 함
    expected = ["토마토 샥슈카"]
    
    result = _clean_menu_list(input_list)
    assert result == expected

def test_normalize_whitespace():
    """
    불필요한 공백이 정상적으로 정제되는지 테스트합니다.
    """
    assert _normalize_whitespace("  가나다   라마바  ") == "가나다 라마바"
    assert _normalize_whitespace("\n와인\t리스트 ") == "와인 리스트"

if __name__ == "__main__":
    pytest.main([__file__])
