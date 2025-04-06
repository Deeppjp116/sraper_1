import requests
import re
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

SERPAPI_KEY = "a7faee7c37b7b2642836ab6e326569e716d9d2839d6af01db90aed90818da595"

def get_edu_websites():
    search_url = f"https://serpapi.com/search.json?q=site:.edu OR site:.ac.in&tbs=qdr:d&num=50&api_key={SERPAPI_KEY}"
    response = requests.get(search_url)
    if response.status_code != 200:
        return []

    data = response.json()
    websites = []

    for result in data.get("organic_results", []):
        link = result.get("link")
        if link and (".edu" in link or ".ac.in" in link):
            websites.append({"name": result.get("title", link), "link": link})

    return websites[:50]

def extract_emails_from_site(base_url, max_pages=10):
    visited = set()
    to_visit = [base_url]
    found_emails = set()

    while to_visit and len(visited) < max_pages:
        url = to_visit.pop(0)
        if url in visited or not url.startswith(base_url):
            continue
        try:
            res = requests.get(url, timeout=5, headers={"User-Agent": "Mozilla/5.0"})
            if res.status_code != 200:
                continue
            visited.add(url)
            soup = BeautifulSoup(res.text, "html.parser")

            # Emails
            found_emails.update(re.findall(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", soup.text))

            # Links to crawl
            for a_tag in soup.find_all("a", href=True):
                full_url = urljoin(url, a_tag["href"])
                if base_url in full_url and full_url not in visited:
                    to_visit.append(full_url)
        except:
            continue

    return list(found_emails)
