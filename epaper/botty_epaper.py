#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Botty op e-paper — Waveshare 2.13inch (B) V3 (212x104, zwart/wit/rood)
op een Raspberry Pi Zero W.

Toont elke refresh een andere Botty uit de LIVE hive — dezelfde Botty's en
dezelfde data als op hive.ramonmoorlag.nl (uit de Supabase `hive_state`).

Layout (landscape):
  links   : Botty als lijntekening (rood gezicht)
  rechts  : naam, generatie-badge (rood), fase + humeur, en de vier balken
            energie / data / fit / geluk. Een kritiek lage balk kleurt rood.

Verversing: elke 3 minuten een nieuwe Botty (roterend).
"""

import time
import json
import random
import urllib.request

from PIL import Image, ImageDraw, ImageFont

# ── Configuratie ────────────────────────────────────────────────────────────
SUPABASE_URL  = "https://oblzouaapvdippyhxmpo.supabase.co"
SUPABASE_ANON = ("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
                 "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ibHpvdWFhcHZkaXBweWh4bXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MzEyMzIsImV4cCI6MjA5NzQwNzIzMn0."
                 "dvrxesHILnLdYYrs0_p1Os7Zwi2BdShLDRj8QCkodP4")
REFRESH_SECONDS = 180          # elke 3 minuten een nieuwe Botty
LAAG_DREMPEL    = 35           # balk hieronder → rood (kritiek)
STATE_FILE      = "/tmp/botty_epaper_last.txt"

# Schermmaat (V3, landscape). getbuffer() van de driver verwacht deze oriëntatie.
W, H = 212, 104

# Kleuren in de 1-bit buffers: 0 = inkt, 255 = wit.
INK, WHITE = 0, 255

# ── Lettertypes ─────────────────────────────────────────────────────────────
def _font(paths, size):
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            pass
    return ImageFont.load_default()

_BOLD = ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]
_REG  = ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]
F_NAAM = _font(_BOLD, 15)
F_GEN  = _font(_BOLD, 11)
F_SUB  = _font(_REG, 10)
F_BAR  = _font(_REG, 10)


# ── Data ophalen ────────────────────────────────────────────────────────────
def haal_bottys():
    url = (SUPABASE_URL +
           "/rest/v1/hive_state?id=eq.main&select=bottys")
    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_ANON,
        "Authorization": "Bearer " + SUPABASE_ANON,
    })
    with urllib.request.urlopen(req, timeout=15) as r:
        data = json.load(r)
    bottys = (data[0].get("bottys") or []) if data else []
    return [b for b in bottys if b and b.get("naam")]


def kies_volgende(bottys):
    """Roteer: toon telkens een andere Botty dan de vorige refresh."""
    namen = [b["naam"] for b in bottys]
    vorige = None
    try:
        with open(STATE_FILE) as f:
            vorige = f.read().strip()
    except Exception:
        pass
    if vorige in namen:
        idx = (namen.index(vorige) + 1) % len(namen)
    else:
        idx = random.randrange(len(namen))
    keuze = bottys[idx]
    try:
        with open(STATE_FILE, "w") as f:
            f.write(keuze["naam"])
    except Exception:
        pass
    return keuze


# ── Botty tekenen ───────────────────────────────────────────────────────────
STAGE_NL = {"baby": "baby", "tiener": "tiener", "volwassen": "volwassen"}
HUMEUR_NL = {
    "blij": "blij", "verveeld": "verveeld", "bang": "bang",
    "eenzaam": "eenzaam",
}


def teken_botty(d_bk, d_rd, cx, cy):
    """Botty als lijntekening rond middelpunt (cx, cy). ~64 breed, ~92 hoog."""
    # antenne + rode knop
    d_bk.line([(cx, cy - 30), (cx + 6, cy - 44)], fill=INK, width=2)
    d_rd.ellipse([cx + 3, cy - 50, cx + 11, cy - 42], fill=INK)
    # zij-sensoren
    for sx in (cx - 26, cx + 26):
        d_bk.ellipse([sx - 7, cy - 9, sx + 7, cy + 5], fill=WHITE, outline=INK, width=2)
    # kop
    d_bk.rounded_rectangle([cx - 26, cy - 30, cx + 26, cy + 12], radius=14,
                           fill=WHITE, outline=INK, width=2)
    # rood scherm-gezicht
    d_rd.rounded_rectangle([cx - 16, cy - 22, cx + 16, cy + 4], radius=8, fill=INK)
    # ogen + mond (zwart, over het rode gezicht)
    d_bk.line([(cx - 10, cy - 16), (cx - 10, cy - 8)], fill=INK, width=3)
    d_bk.line([(cx + 10, cy - 16), (cx + 10, cy - 8)], fill=INK, width=3)
    d_bk.arc([cx - 10, cy - 8, cx + 10, cy + 4], 20, 160, fill=INK, width=2)
    # armen
    d_bk.line([(cx - 18, cy + 14), (cx - 30, cy + 28)], fill=INK, width=2)
    d_bk.line([(cx + 18, cy + 14), (cx + 30, cy + 28)], fill=INK, width=2)
    # lijf
    d_bk.rounded_rectangle([cx - 18, cy + 12, cx + 18, cy + 34], radius=6,
                           fill=WHITE, outline=INK, width=2)
    # benen + voeten
    d_bk.line([(cx - 8, cy + 34), (cx - 12, cy + 44)], fill=INK, width=2)
    d_bk.line([(cx + 8, cy + 34), (cx + 12, cy + 44)], fill=INK, width=2)
    d_bk.ellipse([cx - 18, cy + 42, cx - 8, cy + 48], fill=WHITE, outline=INK, width=2)
    d_bk.ellipse([cx + 8, cy + 42, cx + 18, cy + 48], fill=WHITE, outline=INK, width=2)


def teken_paneel(d_bk, d_rd, b):
    x0 = 84
    naam = str(b.get("naam", "?")).upper()
    d_bk.text((x0, 3), naam, font=F_NAAM, fill=INK)

    # generatie-badge (rood, rechts uitgelijnd)
    gtxt = "G" + str(b.get("generatie", "?"))
    gw = d_rd.textlength(gtxt, font=F_GEN)
    d_rd.text((W - 7 - gw, 3), gtxt, font=F_GEN, fill=INK)

    # sub: fase + humeur (of rood 'ziek')
    fase = STAGE_NL.get(b.get("stage"), str(b.get("stage", "")))
    if b.get("ziek"):
        d_bk.text((x0, 22), fase + " · ", font=F_SUB, fill=INK)
        fw = d_bk.textlength(fase + " · ", font=F_SUB)
        d_rd.text((x0 + fw, 22), "ziek", font=F_SUB, fill=INK)
    else:
        hum = HUMEUR_NL.get(b.get("humeur"), "")
        sub = fase + (" · " + hum if hum else "")
        d_bk.text((x0, 22), sub, font=F_SUB, fill=INK)

    # scheidingslijn
    d_bk.line([(x0, 36), (W - 7, 36)], fill=INK, width=1)

    # vier balken
    bars = [("energie", b.get("energie", 0)),
            ("data",    b.get("data", 0)),
            ("fit",     b.get("fit", 0)),
            ("geluk",   b.get("geluk", 0))]
    y = 42
    bx = x0 + 40
    bw = (W - 7) - bx
    bh = 8
    for lab, val in bars:
        val = max(0, min(100, float(val)))
        d_bk.text((x0, y - 1), lab, font=F_BAR, fill=INK)
        d_bk.rectangle([bx, y, bx + bw, y + bh], outline=INK, width=1)
        vulling = int((bw - 2) * val / 100.0)
        if vulling > 0:
            d = d_rd if val < LAAG_DREMPEL else d_bk   # kritiek laag → rood
            d.rectangle([bx + 1, y + 1, bx + 1 + vulling, y + bh - 1], fill=INK)
        y += 15


def bouw_beeld(b):
    black = Image.new("1", (W, H), WHITE)
    red   = Image.new("1", (W, H), WHITE)
    d_bk = ImageDraw.Draw(black)
    d_rd = ImageDraw.Draw(red)
    d_bk.rectangle([0, 0, W - 1, H - 1], outline=INK, width=1)   # kader
    teken_botty(d_bk, d_rd, cx=42, cy=H // 2)                     # Botty verticaal gecentreerd
    teken_paneel(d_bk, d_rd, b)
    return black, red


def foutbeeld(tekst):
    black = Image.new("1", (W, H), WHITE)
    red = Image.new("1", (W, H), WHITE)
    d = ImageDraw.Draw(black)
    d.rectangle([0, 0, W - 1, H - 1], outline=INK, width=1)
    d.text((10, H // 2 - 8), tekst, font=F_SUB, fill=INK)
    return black, red


# ── Hoofdlus ────────────────────────────────────────────────────────────────
def main():
    from waveshare_epd import epd2in13b_V3
    epd = epd2in13b_V3.EPD()

    while True:
        try:
            bottys = haal_bottys()
            if bottys:
                b = kies_volgende(bottys)
                black, red = bouw_beeld(b)
            else:
                black, red = foutbeeld("Geen Botty's gevonden")
        except Exception as e:
            black, red = foutbeeld("Offline: " + str(e)[:26])

        try:
            epd.init()
            epd.display(epd.getbuffer(black), epd.getbuffer(red))
            epd.sleep()          # scherm in slaap → spaart het paneel
        except Exception as e:
            print("epd-fout:", e)

        time.sleep(REFRESH_SECONDS)


if __name__ == "__main__":
    main()
