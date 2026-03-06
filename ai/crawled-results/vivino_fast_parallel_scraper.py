import asyncio
import json
import os
import re
import random
import sys
from datetime import datetime
from playwright.async_api import async_playwright

# 설정
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_FILE = os.path.join(BASE_DIR, "all_wine_links.json")
OUTPUT_FILE = os.path.join(BASE_DIR, "data_results", "vivino_mass_production_results.json")
FAILED_URLS_FILE = os.path.join(BASE_DIR, "data_results", "failed_urls.json")
LOG_FILE = os.path.join(BASE_DIR, "data_results", "scraping_execution_fast.log")
IMAGE_DIR = os.path.join(BASE_DIR, "images")

# 병렬 처리 설정 (차단 회피를 위해 10로 하향 조정)
CONCURRENCY_LIMIT = 10

# 디렉토리 생성
for d in [os.path.dirname(OUTPUT_FILE), IMAGE_DIR]:
    if not os.path.exists(d):
        os.makedirs(d)

def log(msg):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(msg)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] {msg}\n")

async def human_delay(min_sec=2, max_sec=4):
    """차단 방지를 위해 대기 시간을 더 길게 설정"""
    await asyncio.sleep(random.uniform(min_sec, max_sec))

async def download_image(context, image_url, wine_url):
    try:
        if not image_url: return None
        if image_url.startswith("//"): image_url = "https:" + image_url
        slug = re.search(r'/en/([^/]+)/w/', wine_url).group(1)
        wid = re.search(r'/w/(\d+)', wine_url).group(1)
        yr = re.search(r'year=(\d+)', wine_url).group(1) if 'year=' in wine_url else "nv"
        filename = f"{slug}_{yr}_{wid}.png"
        local_path = os.path.join(IMAGE_DIR, filename)
        if os.path.exists(local_path): return local_path
        
        resp = await context.request.get(image_url)
        if resp and resp.status == 200:
            with open(local_path, "wb") as f: f.write(await resp.body())
            return local_path
    except: pass
    return None

async def scrape_task(context, url, semaphore, results_list, failed_dict, pbar_info):
    async with semaphore:
        pbar_info['current_idx'] += 1
        idx = pbar_info['current_idx']
        total = pbar_info['total']
        
        log(f"[{idx}/{total}] 시작: {url}")
        
        page = await context.new_page()
        # 불필요한 리소스 차단 (속도 향상의 핵심)
        await page.route("**/*.{css,woff,woff2,svg,jpg,jpeg}", lambda route: route.abort())
        
        try:
            # 타임아웃 45초로 단축
            response = await page.goto(url, wait_until="domcontentloaded", timeout=45000)
            
            page_content = await page.content()
            status_code = response.status if response else "Unknown"
            
            if "Access Denied" in page_content or "Cloudflare" in page_content or status_code == 403:
                log(f" [!] 차단 감지됨: {url}")
                failed_dict[url] = {"error": "Blocked", "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
                await page.close()
                return False

            # 데이터 추출 (Next.js Preloaded State)
            state = await page.evaluate("() => window.__PRELOADED_STATE__")
            if not state:
                failed_dict[url] = {"error": "No State", "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
                await page.close()
                return False

            vpi = state.get('vintagePageInformation') or {}
            vintage = vpi.get('vintage') or {}
            wine = vpi.get('wine') or {}
            tastes = vpi.get('tastes') or {}
            winery = (vintage.get('winery') or wine.get('winery')) or {}
            
            # UI 데이터 추출 (Facts, Food Pairings)
            ui_data = await page.evaluate('''() => {
                const res = { all_facts: {}, food_pairings: [] };
                document.querySelectorAll('tr[data-testid="wineFactRow"]').forEach(row => {
                    const label = row.querySelector('th')?.innerText.trim();
                    const value = row.querySelector('td')?.innerText.trim();
                    if (label && value) res.all_facts[label] = value;
                });
                document.querySelectorAll('div[class*="foodPairing__foodContainer"]').forEach(div => {
                    div.innerText.split('\\n').forEach(food => {
                        const clean = food.trim();
                        if (clean && clean.length > 2) res.food_pairings.push(clean);
                    });
                });
                return res;
            }''') or {"all_facts": {}, "food_pairings": []}

            # 가격 추출
            price_text = await page.inner_text("body")
            price_match = re.search(r'₩[0-9,]+', price_text)
            price = price_match.group(0) if price_match else "Unknown"

            # 테이스트 프로필 (구조)
            ts_raw = tastes.get('structure') or {}
            taste_profile = {}
            L_MAP = {"intensity": "boldness", "tannin": "tannic", "sweetness": "sweetness", "acidity": "acidity", "fizziness": "fizziness"}
            if ts_raw:
                for k, v in ts_raw.items():
                    if v is not None and isinstance(v, (int, float)) and "count" not in k:
                        taste_profile[L_MAP.get(k, k)] = f"{round(v * 20, 2)}%"

            # 테이스트 노트 (플레이버)
            taste_notes = []
            for flavor in (tastes.get('flavor') or []):
                group = flavor.get('group', 'Unknown').replace('_', ' ').capitalize()
                all_kws = [kw.get('name') for kw in (flavor.get('primary_keywords') or [])] + \
                          [kw.get('name') for kw in (flavor.get('secondary_keywords') or [])]
                stats = flavor.get('stats') or {}
                taste_notes.append({
                    "group": group, 
                    "keyword": ", ".join(all_kws), 
                    "mentions": f"{stats.get('mentions_count', 0)} mentions"
                })

            res = {
                "wine_name": vintage.get('name') or wine.get('name') or "Unknown",
                "winery": winery.get('name', "Unknown"),
                "wine_type": ui_data['all_facts'].get('Wine style', "Unknown"),
                "price": price,
                "all_facts": ui_data.get('all_facts'),
                "taste_profile": taste_profile,
                "taste_notes": taste_notes,
                "food_pairings": ui_data.get('food_pairings'),
                "image_url": (vintage.get('image') or {}).get('variations', {}).get('medium'),
                "url": url
            }
            
            if res['image_url']:
                res['local_image_path'] = await download_image(context, res['image_url'], url)
            
            results_list.append(res)
            if url in failed_dict: del failed_dict[url]
            
            log(f" >> [완료] {res['wine_name'][:30]}...")
            await page.close()
            await human_delay()
            return True

        except Exception as e:
            err = str(e).split('\n')[0]
            log(f" [!] 실패 ({url}): {err}")
            failed_dict[url] = {"error": err, "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
            await page.close()
            return False

async def main():
    if not os.path.exists(INPUT_FILE):
        log("입력 파일이 없습니다."); return

    all_results = []
    processed_urls = set()
    failed_items = {}

    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                all_results = json.load(f)
                processed_urls = {item['url'] for item in all_results}
        except: pass

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        all_urls = json.load(f)
    
    urls_to_scrape = [u for u in all_urls if u not in processed_urls]
    if not urls_to_scrape:
        log("수집할 항목이 없습니다."); return

    log(f"[*] 병렬 수집 시작 (설정된 병렬 수: {CONCURRENCY_LIMIT})")
    
    semaphore = asyncio.Semaphore(CONCURRENCY_LIMIT)
    pbar_info = {'current_idx': 0, 'total': len(urls_to_scrape)}
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # 병렬 처리를 위해 단일 context 사용 (세션 유지에 유리)
        context = await browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36")
        
        # 10개 단위로 묶어서 태스크 생성 및 실행 (메모리 관리용)
        batch_size = 30
        for i in range(0, len(urls_to_scrape), batch_size):
            batch = urls_to_scrape[i:i+batch_size]
            tasks = [scrape_task(context, url, semaphore, all_results, failed_items, pbar_info) for url in batch]
            
            await asyncio.gather(*tasks)
            
            # 배치 종료 후 중간 저장
            with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                json.dump(all_results, f, ensure_ascii=False, indent=4)
            with open(FAILED_URLS_FILE, "w", encoding="utf-8") as f:
                json.dump(failed_items, f, ensure_ascii=False, indent=4)
            
            log(f"--- 중간 저장 완료 (누적 {len(all_results)}개) ---")
            # 배치 사이 휴식 시간을 더 길게 (20~40초)
            await asyncio.sleep(random.uniform(10, 20))

        await browser.close()
    log("[*] 모든 수집 작업 완료")

if __name__ == "__main__":
    asyncio.run(main())
