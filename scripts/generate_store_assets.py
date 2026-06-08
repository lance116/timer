from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ICON_DIR = ROOT / "assets" / "icons"
STORE_DIR = ROOT / "store-assets"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_REGULAR = "/System/Library/Fonts/Supplemental/Arial.ttf"


def font(size, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REGULAR, size)


def text_center(draw, xy, text, loaded_font, fill):
    box = draw.textbbox((0, 0), text, font=loaded_font)
    width = box[2] - box[0]
    height = box[3] - box[1]
    x = xy[0] - width / 2
    y = xy[1] - height / 2 - box[1]
    draw.text((x, y), text, font=loaded_font, fill=fill)


def text_left(draw, xy, text, loaded_font, fill):
    box = draw.textbbox((0, 0), text, font=loaded_font)
    y = xy[1] - (box[3] - box[1]) / 2 - box[1]
    draw.text((xy[0], y), text, font=loaded_font, fill=fill)


def make_icon(size):
    scale = size / 128
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    pad = round(16 * scale)
    rect = [pad, pad, size - pad, size - pad]
    radius = round(22 * scale)
    draw.rounded_rectangle(rect, radius=radius, fill=(0, 0, 0, 255))
    draw.rounded_rectangle(rect, radius=radius, outline=(255, 255, 255, 255), width=max(1, round(4 * scale)))

    top = round(39 * scale)
    bottom = round(89 * scale)
    left = round(43 * scale)
    right = round(85 * scale)
    neck = round(64 * scale)
    sand = (255, 255, 255, 255)
    muted = (255, 255, 255, 230)
    line = max(1, round(5 * scale))
    draw.line([(left, top), (right, top)], fill=muted, width=line)
    draw.line([(left, bottom), (right, bottom)], fill=muted, width=line)
    draw.polygon([(left, top + line), (right, top + line), (neck, round(61 * scale))], fill=sand)
    draw.polygon([(neck, round(67 * scale)), (left, bottom - line), (right, bottom - line)], fill=sand)
    draw.line([(neck, round(60 * scale)), (neck, round(69 * scale))], fill=muted, width=max(1, round(2 * scale)))
    return image


def draw_background(draw, width, height):
    draw.rectangle([0, 0, width, height], fill=(0, 0, 0))


def make_store_image(path, size, variant):
    width, height = size
    image = Image.new("RGB", size, (0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw_background(draw, width, height)

    cream = (255, 255, 255)
    dim = (168, 168, 168)

    if variant == "screenshot":
        left = 340
        text_left(draw, (left, 120), "TIME REMAINING", font(16, True), dim)
        draw_metrics(draw, left, 190, cream, dim)
    elif variant == "small":
        draw.text((32, 32), "Life Timer", font=font(46, True), fill=cream)
        draw.text((34, 92), "A new tab countdown for limited time.", font=font(22), fill=dim)
        draw.text((34, 164), "48.566648512", font=font(38, True), fill=cream)
        draw.text((36, 222), "years left", font=font(24, True), fill=cream)
        icon = make_icon(96)
        image.paste(icon, (width - 126, height - 126), icon)
    else:
        draw.text((78, 86), "Life Timer", font=font(86, True), fill=cream)
        draw.text((84, 188), "Days, meals, haircuts, World Cups, and summers left.", font=font(34), fill=dim)
        draw.text((78, 326), "48.566648512345 years", font=font(82, True), fill=cream)
        icon = make_icon(160)
        image.paste(icon, (width - 238, 86), icon)

    image.save(path)


def draw_metrics(draw, x, y, cream, dim):
    labels = [
        ("Years", "48.566648512345"),
        ("Days", "17,727.123456789012"),
        ("Meals", "44,318"),
        ("Haircuts", "195"),
        ("World Cups", "13"),
        ("Summers", "49"),
    ]
    for index, (label, value) in enumerate(labels):
        top = y + index * 92
        text_left(draw, (x, top), label.upper(), font(14, True), dim)
        text_left(draw, (x, top + 38), value, font(42, True), cream)


def main():
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    STORE_DIR.mkdir(parents=True, exist_ok=True)

    for size in (16, 32, 48, 128):
        make_icon(size).save(ICON_DIR / f"icon-{size}.png")

    make_store_image(STORE_DIR / "screenshot-1280x800.png", (1280, 800), "screenshot")
    make_store_image(STORE_DIR / "small-promo-440x280.png", (440, 280), "small")
    make_store_image(STORE_DIR / "marquee-promo-1400x560.png", (1400, 560), "marquee")


if __name__ == "__main__":
    main()
