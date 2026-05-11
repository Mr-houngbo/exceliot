from playwright.sync_api import sync_playwright
import sys

def inspect(url):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        print(f"Navigating to {url}...")
        page.goto(url, wait_until="domcontentloaded")
        print("Page title:", page.title())
        
        # Get all class names
        classes = page.evaluate("""
            () => {
                const all = document.querySelectorAll('*');
                const classList = new Set();
                all.forEach(el => {
                    el.classList.forEach(c => classList.add(c));
                });
                return Array.from(classList);
            }
        """)
        print("Classes found:", classes)
        
        # Search for text
        print("\nSearching for 'Excel' related elements...")
        excel_elements = page.evaluate("""
            () => {
                const results = [];
                const all = document.querySelectorAll('*');
                all.forEach(el => {
                    if (el.innerText && el.innerText.toLowerCase().includes('react') && el.children.length === 0) {
                        results.push({
                            tag: el.tagName,
                            text: el.innerText.substring(0, 50),
                            classes: Array.from(el.classList),
                            lineage: [
                                { tag: el.parentElement?.tagName, classes: Array.from(el.parentElement?.classList || []) },
                                { tag: el.parentElement?.parentElement?.tagName, classes: Array.from(el.parentElement?.parentElement?.classList || []) },
                                { tag: el.parentElement?.parentElement?.parentElement?.tagName, classes: Array.from(el.parentElement?.parentElement?.parentElement?.classList || []) }
                            ]
                        });
                    }
                });
                return results;
            }
        """)
        for res in excel_elements[:10]:
            lineage_str = " -> ".join([f"{l['tag']}({l['classes']})" for l in res['lineage']])
            print(f"Found: {res['tag']}({res['classes']}) - '{res['text']}' | Lineage: {lineage_str}")
        
        browser.close()

if __name__ == "__main__":
    inspect(sys.argv[1] if len(sys.argv) > 1 else "https://emploi.educarriere.ci/")
