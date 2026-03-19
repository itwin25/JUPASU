import asyncio
import json
import os
import re
import random
from datetime import datetime
from playwright.async_api import async_playwright

# --- 설정 ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_FILE = os.path.join(BASE_DIR, "all_wine_links.json")
OUTPUT_DIR = os.path.join(BASE_DIR, "data_results")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "vivino_ultra_results.json")
FAILED_URLS_FILE = os.path.join(OUTPUT_DIR, "failed_urls_ultra.json")
LOG_FILE = os.path.join(OUTPUT_DIR, "ultra_scraping.log")
IMAGE_DIR = os.path.join(BASE_DIR, "images")

# 병렬 처리 설정 (안정성을 위해 8~10 권장)
CONCURRENCY_LIMIT = 8

# 디렉토리 생성
for d in [OUTPUT_DIR, IMAGE_DIR]:
    if not os.path.exists(d):
        os.makedirs(d)

def log(msg):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(msg)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] {msg}\n")

async def download_images_parallel(context, wine_data, wine_url):
    local_paths = {}
    wine_name = wine_data.get('wine_name', 'unknown')
    safe_name = re.sub(r'[^\w\s-]', '', wine_name).strip().replace(' ', '_')
    wid = re.search(r'/w/(\d+)', wine_url).group(1) if '/w/' in wine_url else "0"
    yr = re.search(r'year=(\d+)', wine_url).group(1) if 'year=' in wine_url else "nv"

    tasks = []
    async def _dl(img_type, url):
        if not url: return
        try:
            full_url = "https:" + url if url.startswith("//") else url
            filename = f"{safe_name}_{img_type}_{yr}_{wid}.png"
            filepath = os.path.join(IMAGE_DIR, filename)
            if not os.path.exists(filepath):
                resp = await context.request.get(full_url, timeout=5000)
                if resp and resp.status == 200:
                    with open(filepath, "wb") as f: f.write(await resp.body())
            local_paths[img_type] = os.path.relpath(filepath, BASE_DIR)
        except: pass

    for itype, iurl in wine_data.get('images', {}).items():
        tasks.append(_dl(itype, iurl))
    if tasks: await asyncio.gather(*tasks)
    return local_paths

async def scrape_task(context, url, semaphore, results_list, failed_dict, pbar_info):
    async with semaphore:
        pbar_info['current_idx'] += 1
        idx, total = pbar_info['current_idx'], pbar_info['total']
        log(f" [{idx}/{total}] 수집 시작: {url}")
        
        page = await context.new_page()
        # 불필요 리소스 차단
        await page.route("**/*.{css,woff,woff2,svg}", lambda route: route.abort())
        
        try:
            # 1. 페이지 접속 (commit: 서버 응답 즉시 시작, 타임아웃 방지에 탁월)
            response = await page.goto(url, wait_until="commit", timeout=30000)
            if response and response.status == 403:
                log(f" [{idx}/{total}] [!] 차단됨(403): {url}")
                failed_dict[url] = "Blocked 403"
                await page.close(); return False

            # HTML 응답을 받고 데이터 객체가 파싱될 충분한 시간 대기
            await asyncio.sleep(2.5)

            # 2. 정밀 데이터 추출
            data = await page.evaluate('''() => {
                const state = window.__PRELOADED_STATE__ || {};
                const vpi = state.vintagePageInformation || {};
                if (!vpi.wine && !vpi.vintage) return null;

                const wine = vpi.wine || {};
                const vintage = vpi.vintage || {};
                const tastes = vpi.tastes || {};
                const stats = (vintage.statistics || wine.statistics || {});
                const TYPE_MAP = { 1: "Red", 2: "White", 3: "Sparkling", 4: "Rosé", 24: "Dessert", 7: "Fortified" };

                const distribution = vintage.ratings_distribution || stats.ratings_distribution || { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };

                const ts_raw = tastes.structure || {};
                const taste_profile = {};
                const L_MAP = { "intensity": "boldness", "tannin": "tannic", "sweetness": "sweetness", "acidity": "acidity" };
                Object.keys(ts_raw).forEach(k => { if (L_MAP[k]) taste_profile[L_MAP[k]] = `${Math.round(ts_raw[k] * 20)}%`; });

                const taste_notes = (tastes.flavor || []).map(f => ({
                    group: f.group.replace('_', ' ').replace(/\\b\\w/g, c => c.toUpperCase()),
                    keyword: [...(f.primary_keywords || []), ...(f.secondary_keywords || [])].map(k => k.name).join(", "),
                    mentions: `${f.stats?.mentions_count || 0} mentions`
                }));

                const variations = (vintage.image || wine.image || {}).variations || {};
                const all_facts = {};
                document.querySelectorAll('tr[data-testid="wineFactRow"]').forEach(row => {
                    const l = row.querySelector('th')?.innerText.trim();
                    const v = row.querySelector('td')?.innerText.trim();
                    if (l && v) all_facts[l] = v;
                });
                const food_pairings = Array.from(document.querySelectorAll('div[class*="foodPairing__foodContainer"]'))
                    .flatMap(div => div.innerText.split('\\n')).map(t => t.trim()).filter(t => t.length > 2);

                return {
                    wine_name: vintage.name || wine.name || document.querySelector('h1')?.innerText.trim() || "Unknown",
                    winery: wine.winery?.name || vintage.winery?.name || "Unknown",
                    country: wine.region?.country?.name || vintage.winery?.region?.country?.name || vintage.region?.country?.name || "Unknown",
                    region: wine.region?.name || vintage.region?.name || "Unknown",
                    wine_type: TYPE_MAP[wine.type_id] || all_facts['Wine style'] || "Unknown",
                    images: {
                        bottle: variations.bottle_large || variations.bottle_medium || null,
                        label: variations.label_large || variations.label || null,
                        main: variations.large || variations.medium || null
                    },
                    all_facts: all_facts,
                    food_pairings: food_pairings,
                    taste_profile: taste_profile,
                    taste_notes: taste_notes,
                    ratings: { average: stats.ratings_average || 0, count: stats.ratings_count || 0, distribution: distribution }
                };
            }''')

            if data and data['wine_name'] != "Unknown":
                # 가격 추출
                price_text = await page.inner_text("body")
                price_match = re.search(r'₩[0-9,]+', price_text)
                data['price'] = price_match.group(0) if price_match else "Unknown"
                
                data['local_image_paths'] = await download_images_parallel(context, data, url)
                data['url'] = url
                data['collected_at'] = datetime.now().isoformat()
                
                results_list.append(data)
                if url in failed_dict: del failed_dict[url]
                log(f" >> [성공] {data['wine_name'][:25]}... | 분포수집완료")
            else:
                log(f" [{idx}/{total}] [!] 데이터 수집 실패 (재시도 필요): {url}")
                failed_dict[url] = "Retry Needed"

            await page.close()
            return True

        except Exception as e:
            err = str(e).split('\n')[0]
            log(f" [{idx}/{total}] [!] 에러 ({url}): {err}")
            failed_dict[url] = err
            await page.close()
            return False

async def main():
    if not os.path.exists(INPUT_FILE):
        log("입력 파일이 없습니다."); return

    all_results, processed_urls, failed_items = [], set(), {}

    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                all_results = json.load(f)
                processed_urls = {item['url'] for item in all_results}
                log(f"[*] 기존 데이터 {len(processed_urls)}건 로드됨.")
        except: pass

    with open(INPUT_FILE, "r", encoding="utf-8") as f: 
        all_urls = json.load(f)
    
    urls_to_scrape = [u for u in all_urls if u not in processed_urls]
    if not urls_to_scrape:
        log("[*] 모든 작업이 완료되었습니다."); return

    log(f"[*] 울트라 패스트(타임아웃보강) 수집 시작: 대상 {len(urls_to_scrape)}건 (병렬:{CONCURRENCY_LIMIT})")
    
    semaphore = asyncio.Semaphore(CONCURRENCY_LIMIT)
    pbar_info = {'current_idx': 0, 'total': len(urls_to_scrape)}
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
        )
        
        batch_size = 20
        for i in range(0, len(urls_to_scrape), batch_size):
            batch = urls_to_scrape[i:i+batch_size]
            tasks = [scrape_task(context, url, semaphore, all_results, failed_items, pbar_info) for url in batch]
            await asyncio.gather(*tasks)
            
            with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                json.dump(all_results, f, ensure_ascii=False, indent=4)
            with open(FAILED_URLS_FILE, "w", encoding="utf-8") as f:
                json.dump(failed_items, f, ensure_ascii=False, indent=4)
            
            log(f"--- 중간 저장: 누적 {len(all_results)}건 ---")
            await asyncio.sleep(random.uniform(2, 4))

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
