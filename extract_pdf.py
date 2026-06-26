import sys
from pypdf import PdfReader

path = r"C:\Users\Victus\Downloads\Doc1.pdf"
reader = PdfReader(path)
print("NUM_PAGES:", len(reader.pages))
print("=" * 80)
for i, page in enumerate(reader.pages):
    print(f"\n----- PAGE {i+1} -----")
    try:
        text = page.extract_text() or ""
    except Exception as e:
        text = f"[ERROR: {e}]"
    print(text)
