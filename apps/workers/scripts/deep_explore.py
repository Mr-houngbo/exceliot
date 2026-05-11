from playwright.sync_api import sync_playwright
import sys

def explore(url):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, wait_until="domcontentloaded")
        
        # Find all elements that look like a job title link
        links = page.evaluate("""
            () => {
                const results = [];
                const allLinks = document.querySelectorAll('a');
                allLinks.forEach(a => {
                    const text = a.innerText.trim();
                    if (text.length > 10 && a.href.includes('job')) {
                        results.push({
                            text: text,
                            href: a.href,
                            parentTag: a.parentElement.tagName,
                            parentClasses: Array.from(a.parentElement.classList),
                            grandParentClasses: Array.from(a.parentElement.parentElement.classList)
                        });
                    }
                });
                return results;
            }
        """)
        
        for l in links[:5]:
            print(f"Link: '{l['text']}' | Href: {l['href']}")
            print(f"  Parent: {l['parentTag']}({l['parentClasses']}) | GrandParent: {l['grandParentClasses']}")
            
        browser.close()

if __name__ == "__main__":
    explore(sys.argv[1] if len(sys.argv) > 1 else "https://senjob.com/sn/offres-d-emploi.php")
