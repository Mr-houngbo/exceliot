from playwright.sync_api import sync_playwright
from typing import List, Dict, Any
from urllib.parse import urljoin
import time

class HeadlessScraper:
    def __init__(self, name: str, base_url: str, selectors: Dict[str, str]):
        self.name = name
        self.base_url = base_url
        self.selectors = selectors

    def fetch_jobs(self) -> List[Dict[str, Any]]:
        """
        Ultra-robust scraper that uses Playwright and intelligent fallbacks.
        """
        url_to_fetch = self.base_url
        if not url_to_fetch.startswith('http'):
            url_to_fetch = f"https://{url_to_fetch}"
            
        print(f"[{self.name}] Headless scraping {url_to_fetch}...")
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                context = browser.new_context(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    viewport={'width': 1920, 'height': 1080}
                )
                page = context.new_page()
                page.goto(url_to_fetch, wait_until="domcontentloaded", timeout=60000)
                
                # Wait for content to render
                time.sleep(5)
                page.evaluate("window.scrollTo(0, document.body.scrollHeight / 2)")
                time.sleep(2)

                # STRATEGY 1: Use specific container selectors
                container_selector = self.selectors.get('container', 'div')
                containers = page.query_selector_all(container_selector)
                
                # Filter out very small or empty containers
                containers = [c for c in containers if len(c.inner_text().strip()) > 50]
                
                print(f"[{self.name}] Found {len(containers)} potential containers via '{container_selector}'")

                jobs = []
                
                # STRATEGY 2: If no containers or jobs found, try "Link-First" discovery
                if not containers or len(jobs) == 0:
                    print(f"[{self.name}] Strategy 2: Link-First discovery...")
                    all_links = page.query_selector_all("a")
                    for link in all_links:
                        try:
                            href = link.get_attribute('href')
                            text = link.inner_text().strip()
                            
                            # Heuristic: looks like a job link
                            if href and ('.html' in href or 'job' in href or 'offre' in href) and len(text) > 15:
                                # We found a potential job title link!
                                url = urljoin(url_to_fetch, href)
                                
                                # Find a reasonable parent to act as container (up to 3 levels)
                                parent = link
                                for _ in range(3):
                                    parent = parent.evaluate_handle("el => el.parentElement")
                                    # If parent is large enough, it's our container
                                    if len(parent.as_element().inner_text().strip()) > 100:
                                        break
                                
                                container = parent.as_element()
                                company = ""
                                company_el = container.query_selector(".company, .employer, .brand, .basic_black")
                                if company_el:
                                    company = company_el.inner_text().strip()
                                    
                                jobs.append({
                                    "external_id": url,
                                    "title": text,
                                    "url": url,
                                    "company": company,
                                    "source_name": self.name,
                                    "raw_data": {"scraped_at": time.time(), "method": "discovery_link"}
                                })
                        except:
                            continue
                
                # De-duplicate by URL
                unique_jobs = {j['url']: j for j in jobs}.values()
                print(f"[{self.name}] Extraction finished. Found {len(unique_jobs)} jobs.")
                
                browser.close()
                return list(unique_jobs)
        except Exception as e:
            print(f"[{self.name}] Headless Scraper failed: {e}")
            return []
