"""
Download court case documents from shuukh.mn as .doc files.
Zero external dependencies - uses only Python standard library.

Usage:
    python download_cases.py

Since the case listing page requires JavaScript, this script:
  1. Probes case IDs by scanning a range around known IDs
  2. Downloads each valid case as a Word-compatible .doc file
"""

import os
import re
import ssl
import time
import urllib.request
import urllib.error
from html.parser import HTMLParser

# MSYS2 Python lacks local CA certs, so disable SSL verification
SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
MAX_CASES = 100

# Search parameters
START_DATE = "2026/01/01"
END_DATE = "2026/04/06"
COURT_CAT = 2   # 1=civil, 2=criminal, 3=administrative
COURT_LEVEL = 1  # 1=first instance, 2=appellate, 3=appeals chamber

# Known case IDs from user - we'll scan around these ranges
SEED_IDS = [133990, 240212, 240945, 240620]

# How far around each seed to scan (e.g. +/- 50)
SCAN_RADIUS = 30

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
}


class ContentExtractor(HTMLParser):
    """Extract the main case content from the HTML page."""

    def __init__(self):
        super().__init__()
        self._recording = False
        self._depth = 0
        self._target_id = "source-html"
        self.content_parts = []
        self._tag_stack = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if attrs_dict.get("id") == self._target_id:
            self._recording = True
            self._depth = 1
            self.content_parts.append(self._build_tag(tag, attrs))
            return
        if self._recording:
            self._depth += 1
            self.content_parts.append(self._build_tag(tag, attrs))

    def handle_endtag(self, tag):
        if self._recording:
            self.content_parts.append(f"</{tag}>")
            self._depth -= 1
            if self._depth <= 0:
                self._recording = False

    def handle_data(self, data):
        if self._recording:
            self.content_parts.append(data)

    def _build_tag(self, tag, attrs):
        attr_str = ""
        for k, v in attrs:
            if v is not None:
                attr_str += f' {k}="{v}"'
            else:
                attr_str += f" {k}"
        return f"<{tag}{attr_str}>"

    def get_content(self):
        return "".join(self.content_parts)


def fetch_page(url):
    """Fetch a URL and return the HTML content, or None on failure."""
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=30, context=SSL_CTX) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError):
        return None


def extract_case_content(html):
    """Extract the #source-html div content from the page."""
    extractor = ContentExtractor()
    extractor.feed(html)
    content = extractor.get_content()
    if content and len(content.strip()) > 100:
        return content

    # Fallback: grab content between common markers
    # Try to find the main case text area
    match = re.search(
        r'<div[^>]*class="[^"]*col-md-12[^"]*p-5[^"]*"[^>]*>(.*?)</div>\s*</div>\s*</div>',
        html, re.DOTALL
    )
    if match and len(match.group(1).strip()) > 100:
        return match.group(1)

    return None


def wrap_as_doc(content_html):
    """Wrap HTML content in Word-compatible format."""
    return f"""<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
    <meta charset="utf-8">
    <style>
        body {{ font-family: Arial, sans-serif; font-size: 12pt; }}
        table {{ border-collapse: collapse; width: 100%; }}
        td, th {{ border: 1px solid #ccc; padding: 6px; }}
    </style>
</head>
<body>
{content_html}
</body>
</html>"""


def build_case_url(case_id):
    return (
        f"https://shuukh.mn/single_case/{case_id}"
        f"?daterange={START_DATE}%20-%20{END_DATE}%20"
        f"&id={COURT_LEVEL}&court_cat={COURT_CAT}&bb=1"
    )


def generate_candidate_ids():
    """Generate case IDs to try, scanning around seed IDs."""
    candidates = []
    for seed in SEED_IDS:
        for offset in range(-SCAN_RADIUS, SCAN_RADIUS + 1):
            candidates.append(seed + offset)
    # Deduplicate, preserve order
    seen = set()
    unique = []
    for cid in candidates:
        if cid > 0 and cid not in seen:
            seen.add(cid)
            unique.append(cid)
    return unique


def main():
    candidates = generate_candidate_ids()
    print(f"Will probe {len(candidates)} candidate case IDs to find up to {MAX_CASES} valid cases...")
    print(f"Scanning around seed IDs: {SEED_IDS} (+/- {SCAN_RADIUS})\n")

    downloaded = 0
    skipped = 0
    failed = 0
    not_found = 0

    for i, cid in enumerate(candidates):
        if downloaded >= MAX_CASES:
            print(f"\nReached {MAX_CASES} downloads, stopping.")
            break

        outfile = os.path.join(OUTPUT_DIR, f"{cid}.doc")
        if os.path.exists(outfile):
            skipped += 1
            downloaded += 1  # count towards limit
            continue

        url = build_case_url(cid)
        html = fetch_page(url)

        if html is None:
            not_found += 1
            continue

        # Check if the page has actual case content (not an error/empty page)
        if "single_case" not in html and len(html) < 500:
            not_found += 1
            continue

        content = extract_case_content(html)
        if content is None:
            # Save full page as fallback
            content = re.sub(
                r"<(script|style)[^>]*>.*?</\1>", "", html, flags=re.DOTALL
            )
            # Extract just the body
            body_match = re.search(r"<body[^>]*>(.*)</body>", content, re.DOTALL)
            if body_match:
                content = body_match.group(1)
            if len(content.strip()) < 100:
                not_found += 1
                continue

        doc = wrap_as_doc(content)
        with open(outfile, "w", encoding="utf-8") as f:
            f.write(doc)

        downloaded += 1
        print(f"  [{downloaded}/{MAX_CASES}] Downloaded case {cid}.doc")

        # Be respectful to the server
        time.sleep(0.5)

    print(f"\nDone!")
    print(f"  Downloaded: {downloaded - skipped}")
    print(f"  Skipped (already existed): {skipped}")
    print(f"  Not found / empty: {not_found}")
    print(f"  Files saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
