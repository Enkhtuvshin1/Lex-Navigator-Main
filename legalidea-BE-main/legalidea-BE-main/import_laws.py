"""Parse law PDFs and import articles into the database."""
import re
import fitz
import psycopg

# ── Config ───────────────────────────────────────────────────────────────
DB_URL = "postgresql://neondb_owner:npg_tzgrD38vJaSY@ep-divine-brook-a9g1nnk4-pooler.gwc.azure.neon.tech/neondb?sslmode=require"

FILES = [
    {
        "path": r"c:\BatClass\E Diplom\legalidea-BE\files\ЭРҮҮГИЙН ХУУЛЬ.pdf",
        "category": "Эрүүгийн хууль",
        "description": "Монгол Улсын Эрүүгийн хууль (2015, шинэчилсэн найруулга)",
    },
    {
        "path": r"c:\BatClass\E Diplom\legalidea-BE\files\ИРГЭНИЙ ХУУЛЬ.pdf",
        "category": "Иргэний хууль",
        "description": "Монгол Улсын Иргэний хууль (2002)",
    },
    {
        "path": r"c:\BatClass\E Diplom\legalidea-BE\files\ЗАХИРГААНЫ ЕРӨНХИЙ ХУУЛЬ.pdf",
        "category": "Захиргааны ерөнхий хууль",
        "description": "Монгол Улсын Захиргааны ерөнхий хууль",
    },
]

# Pattern 1: "1.1 дүгээр зүйл." (Criminal law style - decimal number)
# Pattern 2: "1 дүгээр зүйл." (Civil/Admin law style - integer number)
ARTICLE_RE = re.compile(
    r"^(\d+(?:\.\d+)?)\s+д[үу]г[ээа]+р\s+зүйл[.\s]*(.+?)$",
    re.MULTILINE,
)


def extract_text(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text() + "\n"
    doc.close()
    return text


def parse_articles(text: str) -> list[dict]:
    matches = list(ARTICLE_RE.finditer(text))
    articles = []
    for i, match in enumerate(matches):
        number = match.group(1)
        title = match.group(2).strip()
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        content = text[start:end].strip()
        # Clean up content
        content = re.sub(r"\n{3,}", "\n\n", content)
        articles.append({
            "number": number,
            "title": title,
            "content": content[:10000],
        })
    return articles


def main():
    import io, sys
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

    conn = psycopg.connect(DB_URL)
    cur = conn.cursor()

    # Clear existing data
    cur.execute("DELETE FROM law_articles")
    cur.execute("DELETE FROM law_categories")
    conn.commit()
    print("Cleared existing law data.")

    total = 0
    for f in FILES:
        print(f"\nProcessing: {f['category']}")

        # Create category
        cur.execute(
            "INSERT INTO law_categories (name, description) VALUES (%s, %s) RETURNING id",
            (f["category"], f["description"]),
        )
        cat_id = cur.fetchone()[0]
        print(f"  Created category id={cat_id}")

        # Extract and parse
        text = extract_text(f["path"])
        articles = parse_articles(text)
        print(f"  Found {len(articles)} articles")

        # Show first 3 for verification
        for art in articles[:3]:
            print(f"    {art['number']} - {art['title'][:60]}")

        # Insert articles
        for art in articles:
            cur.execute(
                "INSERT INTO law_articles (category_id, number, title, content) VALUES (%s, %s, %s, %s)",
                (cat_id, art["number"], art["title"], art["content"]),
            )
        total += len(articles)

        conn.commit()
        print(f"  Inserted {len(articles)} articles")

    print(f"\nDone! Total articles imported: {total}")
    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
