# Registry of CSS selectors for different job boards
# These are used by both GenericHTMLScraper and HeadlessScraper

SELECTORS = {
    "indeed": {
        "container": ".job_seen_beacon",
        "title": "h2.jobTitle",
        "link": "a[data-jk]",
        "company": ".companyName",
        "location": ".companyLocation"
    },
    "welcometothejungle": {
        "container": "li.wjtj-1", # Note: WTTJ often uses obfuscated classes, this is a placeholder
        "title": "h4",
        "link": "a",
        "company": "span"
    },
    "senjob": {
        "container": "div.resultsOffre > div, .offre-item, .job-box",
        "title": ".offre_title, a, h4",
        "link": "a",
        "company": ".basic_black, .company"
    },
    "educarriere": {
        "container": ".offre-item, .job-item",
        "title": ".title, h3",
        "link": "a",
        "company": ".company"
    },
    "linkedin": {
        "container": ".base-card",
        "title": ".base-search-card__title",
        "link": "a.base-card__full-link",
        "company": ".base-search-card__subtitle"
    },
    "default": {
        "container": "div.job, .job-item, .job-card, article, tr.job, .card-job, .listing-item, .offre-item, .post-item, [class*='job-item'], [class*='offer-item']",
        "title": "h2, h3, h4, .title, .job-title, .card-title, .offer-title, [class*='title']",
        "link": "a[href*='job'], a[href*='offre'], a[href*='recrutement'], a",
        "company": ".company, .employer, .brand, .company-name, .enterprise, .recruiter",
        "location": ".location, .city, .place, .region"
    }
}

def get_selectors(source_name: str) -> dict:
    """Returns the best matching selectors for a source name."""
    name = source_name.lower().replace(" ", "")
    for key, value in SELECTORS.items():
        if key in name:
            return value
    return SELECTORS["default"]
