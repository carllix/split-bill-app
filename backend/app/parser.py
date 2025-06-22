
import fitz
import re


def extract_number(label, text):
    pattern = rf"{label}\s*-?Rp([\d.]+)"
    match = re.search(pattern, text)
    if match:
        return int(match.group(1).replace(".", ""))
    else:
        return 0


def extract_items_from_pdf(file_path: str):
    doc = fitz.open(file_path)
    text = "\n".join(page.get_text() for page in doc)
    lines = text.splitlines()

    items = []
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        match = re.match(r"^(\d+)\s(.+)", line)
        if match:
            qty = int(match.group(1))
            name = match.group(2).strip()

            # Cek jika nama item mungkin multiline
            j = i + 1
            while j < len(lines) and not re.match(r"^@Rp[\d.]+$", lines[j].strip()):
                name += " " + lines[j].strip()
                j += 1

            # Ambil unit price dan total price
            if j + 1 < len(lines):
                unit_price_line = lines[j].strip()
                total_price_line = lines[j + 1].strip()
                unit_price_match = re.match(r"^@Rp([\d.]+)$", unit_price_line)
                total_price_match = re.match(r"^Rp([\d.]+)$", total_price_line)

                if unit_price_match and total_price_match:
                    unit_price = int(unit_price_match.group(1).replace(".", ""))
                    items.append({
                        "name": name,
                        "quantity": qty,
                        "unit_price": unit_price
                    })
                    i = j + 2
                    continue
        i += 1

    total_price = extract_number("Total harga", text)
    handling_fee = extract_number("Biaya penanganan dan pengiriman", text)
    other_fee = extract_number("Biaya lainnya", text)
    discount = extract_number("Diskon(?! PLUS)", text)
    discount_plus = extract_number("Diskon PLUS", text)
    total_payment = extract_number("Total pembayaran", text)

    return items, total_price, handling_fee, other_fee, discount, discount_plus, total_payment