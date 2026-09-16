from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630

BG = (11, 14, 26)
PANEL = (28, 33, 64)
INK = (241, 243, 251)
INK_DIM = (154, 160, 195)
ACCENT = (255, 204, 77)
ACCENT2 = (110, 231, 255)
FICTION = (255, 93, 122)
SCIENCE = (110, 231, 255)

img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

# soft radial-ish glow blobs (approximated with overlapping translucent ellipses)
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gdraw = ImageDraw.Draw(glow)
gdraw.ellipse([-200, -250, 500, 350], fill=(34, 40, 90, 130))
gdraw.ellipse([850, -150, 1400, 300], fill=(42, 31, 77, 130))
glow = glow.filter = glow  # no-op placeholder to keep structure simple
img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
draw = ImageDraw.Draw(img)

FONT_DIR = "/System/Library/Fonts/Supplemental/"
title_font = ImageFont.truetype(FONT_DIR + "Arial Bold.ttf", 92)
tag_font = ImageFont.truetype(FONT_DIR + "Arial.ttf", 34)
card_title_font = ImageFont.truetype(FONT_DIR + "Arial Bold.ttf", 26)
card_sub_font = ImageFont.truetype(FONT_DIR + "Arial.ttf", 18)
badge_font = ImageFont.truetype(FONT_DIR + "Arial Bold.ttf", 16)
vs_font = ImageFont.truetype(FONT_DIR + "Arial Black.ttf", 40)


def rounded_rect(d, box, radius, fill=None, outline=None, width=1):
    d.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def draw_card(cx, cy, w, h, color, badge_text, lines):
    box = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2]
    rounded_rect(draw, box, 22, fill=PANEL, outline=color, width=4)

    bx0, by0 = box[0] + 18, box[1] + 18
    badge_w, badge_h = 96, 30
    rounded_rect(draw, [bx0, by0, bx0 + badge_w, by0 + badge_h], 15, fill=color)
    bt_bbox = draw.textbbox((0, 0), badge_text, font=badge_font)
    bt_w = bt_bbox[2] - bt_bbox[0]
    draw.text((bx0 + (badge_w - bt_w) / 2, by0 + 5), badge_text, font=badge_font, fill=(16, 9, 31))

    cover_box = [box[0] + 18, by0 + badge_h + 14, box[2] - 18, box[3] - 90]
    rounded_rect(draw, cover_box, 12, fill=(5, 7, 15), outline=(42, 47, 82), width=2)
    # simple spine/page hint lines on the placeholder cover
    for i in range(4):
        y = cover_box[1] + 30 + i * 26
        draw.line([cover_box[0] + 20, y, cover_box[2] - 20, y], fill=(30, 35, 66), width=3)

    ty = box[3] - 78
    for i, (text, font, fill) in enumerate(lines):
        draw.text((box[0] + 20, ty), text, font=font, fill=fill)
        ty += 26


# Title
title = "Book Battler"
tb = draw.textbbox((0, 0), title, font=title_font)
tw = tb[2] - tb[0]
draw.text(((W - tw) / 2, 90), title, font=title_font, fill=ACCENT)

tagline = "Scan two books. Watch them fight."
tb2 = draw.textbbox((0, 0), tagline, font=tag_font)
tw2 = tb2[2] - tb2[0]
draw.text(((W - tw2) / 2, 200), tagline, font=tag_font, fill=INK_DIM)

# Two matchup cards
card_w, card_h = 260, 340
cy = 430
draw_card(
    W / 2 - 220, cy, card_w, card_h, FICTION, "FICTION",
    [("Your Book", card_title_font, INK), ("HP 96  ATK 39", card_sub_font, INK_DIM)],
)
draw_card(
    W / 2 + 220, cy, card_w, card_h, SCIENCE, "SCIENCE",
    [("Their Book", card_title_font, INK), ("HP 132  ATK 27", card_sub_font, INK_DIM)],
)

vb = draw.textbbox((0, 0), "VS", font=vs_font)
vw, vh = vb[2] - vb[0], vb[3] - vb[1]
draw.text((W / 2 - vw / 2, cy - vh / 2 - 10), "VS", font=vs_font, fill=ACCENT2)

img.save("assets/og-image.png")
print("saved assets/og-image.png", img.size)
