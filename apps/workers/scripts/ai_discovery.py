import os
import sys
import json
from playwright.sync_api import sync_playwright
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# Add current working directory to path to import local modules
sys.path.append(os.getcwd())
from db.supabase import supabase

def discover_selectors(url, source_name):
    print(f"--- Discovering Selectors for {source_name} ({url}) ---")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        
        try:
            page.goto(url, wait_until="networkidle", timeout=60000)
            time_to_wait = 5
            print(f"Waiting {time_to_wait}s for JS...")
            page.wait_for_timeout(time_to_wait * 1000)
            
            # Clean HTML to reduce tokens
            html_content = page.evaluate("""
                () => {
                    // Remove scripts, styles, svg, etc.
                    const toRemove = ['script', 'style', 'svg', 'path', 'iframe', 'noscript'];
                    toRemove.forEach(tag => {
                        document.querySelectorAll(tag).forEach(el => el.remove());
                    });
                    
                    // Simplify attributes (keep only class, id, href)
                    const all = document.querySelectorAll('*');
                    all.forEach(el => {
                        const attrs = el.attributes;
                        for (let i = attrs.length - 1; i >= 0; i--) {
                            if (!['class', 'id', 'href'].includes(attrs[i].name)) {
                                el.removeAttribute(attrs[i].name);
                            }
                        }
                    });
                    
                    return document.body.innerHTML.substring(0, 30000); // Limit to 30k chars
                }
            """)
            
            client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
            
            prompt = f"""
            Analyze the following HTML snippet from a job board ({source_name}).
            Identify the CSS selectors for:
            1. The container element of each job listing.
            2. The job title (inside the container).
            3. The link to the job (inside the container).
            4. The company name (inside the container).

            Return ONLY a JSON object like this:
            {{
              "container": ".selector",
              "title": ".selector",
              "link": ".selector",
              "company": ".selector"
            }}

            HTML:
            {html_content}
            """
            
            print("Consulting Gemini for selectors...")
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )
            
            raw_json = response.text.strip()
            # Clean potential markdown backticks
            if "```json" in raw_json:
                raw_json = raw_json.split("```json")[1].split("```")[0].strip()
            elif "```" in raw_json:
                raw_json = raw_json.split("```")[1].strip()
                
            selectors = json.loads(raw_json)
            print(f"Success! Found selectors: {selectors}")
            
            # Update selectors.py (Mocked here, we can append to a file or update DB)
            return selectors
            
        except Exception as e:
            print(f"Discovery failed: {e}")
            return None
        finally:
            browser.close()

if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else "https://www.senjob.com/"
    source_name = sys.argv[2] if len(sys.argv) > 2 else "senjob"
    discover_selectors(url, source_name)
