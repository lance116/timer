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


def make_icon(size):
    scale = size / 128
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    pad = round(16 * scale)
    rect = [pad, pad, size - pad, size - pad]
    radius = round(22 * scale)
    draw.rounded_rectangle(rect, radius=radius, fill=(13, 16, 20, 255))
    draw.rounded_rectangle(rect, radius=radius, outline=(243, 182, 109, 255), width=max(1, round(4 * scale)))

    center_x = size / 2
    top = round(39 * scale)
    bottom = round(89 * scale)
    left = round(43 * scale)
    right = round(85 * scale)
    neck = round(64 * scale)
    sand = (243, 182, 109, 255)
    muted = (246, 240, 231, 230)
    line = max(1, round(5 * scale))
    draw.line([(left, top), (right, top)], fill=muted, width=line)
    draw.line([(left, bottom), (right, bottom)], fill=muted, width=line)
    draw.polygon([(left, top + line), (right, top + line), (neck, round(61 * scale))], fill=sand)
    draw.polygon([(neck, round(67 * scale)), (left, bottom - line), (right, bottom - line)], fill=sand)
    draw.line([(neck, round(60 * scale)), (neck, round(69 * scale))], fill=muted, width=max(1, round(2 * scale)))
    return image


def draw_background(draw, width, height):
    top = (13, 15, 16)
    bottom = (7, 27, 25)
    for y in range(height):
        t = y / max(1, height - 1)
        color = tuple(round(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
        draw.line([(0, y), (width, y)], fill=color)

    teal = (12, 45, 40)
    draw.polygon([(0, 0), (width * 0.58, 0), (0, height)], fill=teal)
    grid = (30, 39, 37)
    for x in range(0, width, 72):
        draw.line([(x, 0), (x, height)], fill=grid)
    for y in range(0, height, 72):
        draw.line([(0, y), (width, y)], fill=grid)


def make_store_image(path, size, variant):
    width, height = size
    image = Image.new("RGB", size, (13, 15, 16))
    draw = ImageDraw.Draw(image)
    draw_background(draw, width, height)

    cream = (246, 240, 231)
    orange = (243, 182, 109)
    dim = (185, 186, 178)

    if variant == "screenshot":
        draw.text((88, 92), "TIME REMAINING", font=font(18, True), fill=orange)
        draw.multiline_text(
            (88, 132),
            "Remember, you\nhave limited\ntime here.",
            font=font(82, True),
            fill=cream,
            spacing=2,
        )
        draw.text((88, 520), "48.5666485 years", font=font(118, True), fill=cream)
        draw.text((92, 656), "Target: January 1, 2075.", font=font(24), fill=dim)

        panel = [800, 40, 1238, 138]
        draw.rounded_rectangle(panel, radius=8, fill=(18, 20, 24), outline=(65, 68, 75), width=1)
        draw.text((822, 61), "BORN", font=font(14, True), fill=dim)
        draw.text((1024, 61), "LIVE TO", font=font(14, True), fill=dim)
        draw.rounded_rectangle([822, 82, 996, 118], radius=6, fill=(32, 34, 38), outline=(75, 78, 86))
        draw.rounded_rectangle([1024, 82, 1146, 118], radius=6, fill=(32, 34, 38), outline=(75, 78, 86))
        draw.rounded_rectangle([1160, 82, 1216, 118], radius=6, fill=orange)
        draw.text((836, 90), "1990-01-01", font=font(18), fill=cream)
        draw.text((1040, 90), "85", font=font(18), fill=cream)
        text_center(draw, (1188, 100), "Save", font(16, True), (22, 17, 12))
    elif variant == "small":
        draw.text((32, 32), "Life Timer", font=font(46, True), fill=cream)
        draw.text((34, 92), "A new tab countdown for limited time.", font=font(22), fill=dim)
        draw.text((34, 164), "48.5666485", font=font(54, True), fill=orange)
        draw.text((36, 222), "years left", font=font(24, True), fill=cream)
        icon = make_icon(96)
        image.paste(icon, (width - 126, height - 126), icon)
    else:
        draw.text((78, 86), "Life Timer", font=font(86, True), fill=cream)
        draw.text((84, 188), "Remember, you have limited time here.", font=font(36), fill=dim)
        draw.text((78, 326), "48.5666485 years", font=font(118, True), fill=orange)
        icon = make_icon(160)
        image.paste(icon, (width - 238, 86), icon)

    image.save(path)


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
