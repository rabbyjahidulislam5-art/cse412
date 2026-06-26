import os
from pypdf import PdfReader

path = r"C:\Users\Victus\Downloads\Doc1.pdf"
reader = PdfReader(path)

out_dir = r"C:\Users\Victus\ZCodeProject\pdf_imgs"
os.makedirs(out_dir, exist_ok=True)

total = 0
for i, page in enumerate(reader.pages):
    imgs = page.images
    for j, img in enumerate(imgs):
        # img has .name and .data
        name = img.name
        out_path = os.path.join(out_dir, f"page{i+1:02d}_{j}_{name}")
        with open(out_path, "wb") as f:
            f.write(img.data)
            total += 1

print("TOTAL_IMAGES:", total)
print("OUT_DIR:", out_dir)
