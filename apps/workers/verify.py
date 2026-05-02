from tasks.scrape_tasks import run_adzuna_scraper

if __name__ == "__main__":
    print("Starting manual verification of the pipeline...")
    run_adzuna_scraper()
    print("Verification script finished.")
