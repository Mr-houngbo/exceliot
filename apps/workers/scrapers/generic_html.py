import httpx
from bs4 import BeautifulSoup
from typing import List, Dict, Any
from urllib.parse import urljoin
import time

class GenericHTMLScraper:
    def __init__(self, name: str, base_url: str, selectors: Dict[str, str]):
        self.name = name
        self.base_url = base_url
        self.selectors = selectors
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        }

    def fetch_jobs(self) -> List[Dict[str, Any]]:
        """
        Scrapes jobs from the base_url using provided selectors.
        Returns a list of dictionaries with standardized job fields.
        """
        url_to_fetch = self.base_url
        if not url_to_fetch.startswith('http'):
            url_to_fetch = f"https://{url_to_fetch}"

        print(f"[{self.name}] Scraping {url_to_fetch}...")
        try:
            with httpx.Client(follow_redirects=True, timeout=30.0) as client:
                resp = client.get(url_to_fetch, headers=self.headers)
                if resp.status_code != 200:
                    print(f"[{self.name}] Error: Status {resp.status_code}")
                    return []
                
                soup = BeautifulSoup(resp.text, 'html.parser')
                
                # Check for container selector
                container_selector = self.selectors.get('container')
                if not container_selector:
                    print(f"[{self.name}] Error: No container selector provided.")
                    return []
                
                containers = soup.select(container_selector)
                print(f"[{self.name}] Found {len(containers)} containers.")
                
                jobs = []
                for container in containers:
                    try:
                        title_el = container.select_one(self.selectors['title'])
                        if not title_el: continue
                        title = title_el.get_text(strip=True)
                        
                        link_el = container.select_one(self.selectors['link'])
                        if not link_el or not link_el.get('href'): continue
                        url = urljoin(self.base_url, link_el['href'])
                        
                        company = ""
                        if 'company' in self.selectors:
                            company_el = container.select_one(self.selectors['company'])
                            if company_el:
                                company = company_el.get_text(strip=True)
                                
                        location = ""
                        if 'location' in self.selectors:
                            loc_el = container.select_one(self.selectors['location'])
                            if loc_el:
                                location = loc_el.get_text(strip=True)

                        # Basic validation: must have "excel" or related keywords in title for some sources
                        # Or we let the scorer handle it later. We'll let the scorer handle it.
                        
                        jobs.append({
                            "external_id": url, # Fallback to URL as ID for HTML scrapers
                            "title": title,
                            "url": url,
                            "company": company,
                            "location": location,
                            "source_name": self.name,
                            "raw_data": {"scraped_at": time.time()}
                        })
                    except Exception as e:
                        print(f"[{self.name}] Error parsing container: {e}")
                        continue
                
                return jobs
        except Exception as e:
            print(f"[{self.name}] Scraper failed: {e}")
            return []
