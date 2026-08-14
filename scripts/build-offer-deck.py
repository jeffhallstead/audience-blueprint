#!/usr/bin/env python3
"""
Builds the Signature Offer Deck — a 16:9 PDF used live on sales calls to show
what a 90-day engagement delivers over 30, 60 and 90 days.

Phase content, KPI targets, dimensions and personas mirror the live product:
  - src/lib/blueprint/rules.ts   (ROADMAP_TEMPLATES, KPI_RULES, categories)
  - src/lib/personas.ts          (behavioral personas)
  - src/lib/assessment/config.ts (maturity levels)

Font handling (variable-font instancing with unique per-weight name records)
is carried over from scripts/build-guide.py.

Run: python3 scripts/build-offer-deck.py
Out: /mnt/documents/publisher-blueprint-signature-offer.pdf
"""

import os
import subprocess

from reportlab.lib.colors import Color, HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.platypus import Paragraph

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_PDF = "/mnt/documents/publisher-blueprint-signature-offer.pdf"
FONT_DIR = "/tmp/guide-fonts"

# --- Brand palette (src/styles.css) --------------------------------------
OBSIDIAN = HexColor("#09090b")
INK = HexColor("#141417")
BODY = HexColor("#33333a")
MUTED = HexColor("#6b6b76")
INDIGO = HexColor("#6366f1")
INDIGO_SOFT = HexColor("#eeeefe")
RULE = HexColor("#e3e3ea")
PAPER = HexColor("#ffffff")
WHITE = HexColor("#ffffff")
DIMW = Color(1, 1, 1, 0.66)
FAINTW = Color(1, 1, 1, 0.38)

PAGE_W, PAGE_H = 13.333 * inch, 7.5 * inch
M = 0.85 * inch


def ensure_fonts():
    os.makedirs(FONT_DIR, exist_ok=True)
    needed = ["Outfit-400.ttf", "Outfit-600.ttf", "Outfit-700.ttf",
              "PJS-400.ttf", "PJS-600.ttf", "PJS-700.ttf"]
    if not all(os.path.exists(os.path.join(FONT_DIR, n)) for n in needed):
        srcs = {
            "Outfit": "https://raw.githubusercontent.com/google/fonts/main/ofl/outfit/Outfit%5Bwght%5D.ttf",
            "PJS": "https://raw.githubusercontent.com/google/fonts/main/ofl/plusjakartasans/PlusJakartaSans%5Bwght%5D.ttf",
        }
        from fontTools.ttLib import TTFont as FTFont
        from fontTools.varLib.instancer import instantiateVariableFont
        for name, url in srcs.items():
            vf = os.path.join(FONT_DIR, f"{name}-VF.ttf")
            if not os.path.exists(vf):
                subprocess.run(["curl", "-sfL", "-o", vf, url], check=True)
            for w in (400, 600, 700):
                dst = os.path.join(FONT_DIR, f"{name}-{w}.ttf")
                if not os.path.exists(dst):
                    f = FTFont(vf)
                    instantiateVariableFont(f, {"wght": w}, inplace=True)
                    unique = f"{name}{w}"
                    for rec in f["name"].names:
                        if rec.nameID in (1, 3, 4, 6, 16, 17):
                            f["name"].setName(unique, rec.nameID, rec.platformID,
                                              rec.platEncID, rec.langID)
                    f.save(dst)
    pdfmetrics.registerFont(TTFont("Display", os.path.join(FONT_DIR, "Outfit-700.ttf")))
    pdfmetrics.registerFont(TTFont("DisplayMed", os.path.join(FONT_DIR, "Outfit-600.ttf")))
    pdfmetrics.registerFont(TTFont("DisplayLight", os.path.join(FONT_DIR, "Outfit-400.ttf")))
    pdfmetrics.registerFont(TTFont("Body", os.path.join(FONT_DIR, "PJS-400.ttf")))
    pdfmetrics.registerFont(TTFont("BodyMed", os.path.join(FONT_DIR, "PJS-600.ttf")))
    pdfmetrics.registerFont(TTFont("BodyBold", os.path.join(FONT_DIR, "PJS-700.ttf")))


def st(name, font, size, leading, color, **kw):
    return ParagraphStyle(name, fontName=font, fontSize=size, leading=leading,
                          textColor=color, **kw)


def styles():
    return {
        "kicker": st("kicker", "BodyBold", 11, 14, INDIGO),
        "kicker_d": st("kicker_d", "BodyBold", 11, 14, INDIGO),
        "title": st("title", "Display", 40, 45, INK),
        "title_d": st("title_d", "Display", 44, 50, WHITE),
        "sub": st("sub", "DisplayLight", 22, 30, BODY),
        "sub_d": st("sub_d", "DisplayLight", 22, 30, DIMW),
        "body": st("body", "Body", 15, 23, BODY),
        "body_d": st("body_d", "Body", 15, 23, DIMW),
        "bullet": st("bullet", "Body", 15, 23, BODY, leftIndent=18, bulletIndent=2,
                     spaceAfter=8),
        "bullet_d": st("bullet_d", "Body", 15, 23, DIMW, leftIndent=18, bulletIndent=2,
                       spaceAfter=8),
        "cardh": st("cardh", "BodyBold", 14, 18, INK),
        "cardb": st("cardb", "Body", 12.5, 17.5, MUTED),
        "cardh_d": st("cardh_d", "BodyBold", 14, 18, WHITE),
        "cardb_d": st("cardb_d", "Body", 12.5, 17.5, DIMW),
        "label": st("label", "BodyBold", 10.5, 14, INDIGO),
        "small": st("small", "Body", 11.5, 16, MUTED),
        "num": st("num", "Display", 30, 32, INDIGO),
    }


S = {}


# --- primitives ----------------------------------------------------------
def para(c, text, style, x, y_top, width):
    """Draw a paragraph with its top edge at y_top. Returns the new y (bottom)."""
    p = Paragraph(text, style)
    _, h = p.wrapOn(c, width, PAGE_H)
    p.drawOn(c, x, y_top - h)
    return y_top - h


def bullets(c, items, style, x, y_top, width, gap=8):
    y = y_top
    for it in items:
        p = Paragraph(it, style, bulletText="\u2022")
        _, h = p.wrapOn(c, width, PAGE_H)
        p.drawOn(c, x, y - h)
        y -= h + gap
    return y


def bg(c, dark=False):
    c.setFillColor(OBSIDIAN if dark else PAPER)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)


def footer(c, page=None, dark=False):
    c.setFont("Body", 9)
    c.setFillColor(FAINTW if dark else MUTED)
    c.drawString(M, 0.45 * inch, "Publisher Blueprint  ·  Jeff Hallstead")
    c.drawRightString(PAGE_W - M, 0.45 * inch, str(c.getPageNumber()))


def slide_header(c, kicker, title, dark=False, y=None):
    y = y or PAGE_H - 1.0 * inch
    y = para(c, kicker.upper(), S["kicker"], M, y, PAGE_W - 2 * M) - 10
    y = para(c, title, S["title_d"] if dark else S["title"], M, y, PAGE_W - 2 * M)
    c.setFillColor(INDIGO)
    c.rect(M, y - 22, 1.1 * inch, 3, stroke=0, fill=1)
    return y - 52


def card(c, x, y_top, w, h, title, lines, dark=False, tint=None, badge=None):
    """Rounded panel with a title and body lines."""
    c.setFillColor(tint or (HexColor("#141419") if dark else HexColor("#fafafc")))
    c.setStrokeColor(HexColor("#26262e") if dark else RULE)
    c.setLineWidth(0.8)
    c.roundRect(x, y_top - h, w, h, 8, stroke=1, fill=1)
    inner = w - 36
    y = y_top - 24
    if badge:
        c.setFillColor(INDIGO)
        c.setFont("BodyBold", 9.5)
        c.drawString(x + 18, y - 2, badge.upper())
        y -= 20
    y = para(c, title, S["cardh_d"] if dark else S["cardh"], x + 18, y, inner) - 10
    for ln in lines:
        y = para(c, ln, S["cardb_d"] if dark else S["cardb"], x + 18, y, inner) - 7
    return y


# =========================================================================
# CONTENT  — mirrors the live engine
# =========================================================================

OFFER_NAME = "The Publisher Engagement"

DIMENSIONS = [
    ("Audience", "The first-party list you own and can reach without a platform's permission."),
    ("Content", "Editorial capability, original IP, and the formats you can sustain."),
    ("Distribution", "How reliably work reaches the right people without paid dependency."),
    ("Operations", "Team, workflow, documentation, and measurement discipline."),
    ("Strategy", "Clarity on who you publish for and what you promise them."),
    ("Alignment", "Executive support, budget, and cross-functional commitment."),
]

LEVELS = [
    ("1", "Observer", "0–34"),
    ("2", "Publisher", "35–54"),
    ("3", "Studio", "55–71"),
    ("4", "Media Brand", "72–85"),
    ("5", "Category Leader", "86+"),
]

PERSONAS = [
    ("Paid Media Plateau", "The brand was built on paid. The CAC curve is bending the wrong way."),
    ("Campaign Factory", "The team ships constantly, but nothing compounds."),
    ("Orphaned Audience", "You have the content. You do not own the audience."),
    ("Stalled Studio", "The content operation is real. The board cannot see it."),
    ("Funded Builder", "Money and ambition are there. The sequence is not."),
    ("Category Leader", "Few critical gaps — the question is defensibility."),
]

# ROADMAP_TEMPLATES.scaling from src/lib/blueprint/rules.ts. Foundational and
# advanced variants are noted on the calibration slide.
PHASES = [
    {
        "days": "Days 1–30",
        "phase": "Foundation",
        "objective": "Concentrate investment behind the highest-yield franchise.",
        "activities": [
            "Rank every active format by subscriber yield and retire the bottom third",
            "Name a host and lock a season structure for the flagship format",
            "Define the repurposing template: one asset, five derivatives",
            "Set a single north-star audience metric reviewed monthly",
        ],
        "metrics": ["Portfolio ranked and pruned", "Season one greenlit",
                    "Repurposing template in use"],
        "deliverable": "Publisher Index score, full Blueprint, and a ranked portfolio decision",
    },
    {
        "days": "Days 31–60",
        "phase": "Execution",
        "objective": "Scale production throughput and open new distribution paths.",
        "activities": [
            "Ship the first four episodes of the flagship season",
            "Sign three co-marketing partners with adjacent audiences",
            "Automate the derivative production pipeline",
            "Stand up the audience dashboard for weekly review",
        ],
        "metrics": ["4 episodes shipped on schedule", "3 partnerships signed",
                    "Reach per asset up 30%"],
        "deliverable": "A running editorial system and a live audience dashboard",
    },
    {
        "days": "Days 61–90",
        "phase": "Optimization",
        "objective": "Tie audience growth to commercial outcomes.",
        "activities": [
            "Attribute pipeline influence to owned audience segments",
            "Run a retention program against the most engaged cohort",
            "Rebalance spend from paid reach to owned production",
            "Publish a quarterly audience report to the executive team",
        ],
        "metrics": ["Pipeline influence reported", "Retention cohort improved",
                    "Paid dependency reduced"],
        "deliverable": "An executive readout and a funded 12-month plan",
    },
]

KPIS = [
    ("Email growth rate", "Net new subscribers month over month.", "8–12% monthly"),
    ("Engaged reach", "Audience with a meaningful interaction in 30 days.", "35% of list"),
    ("Returning visitors", "Share of visits from known audience.", "40% of sessions"),
    ("Organic traffic", "Non-paid sessions to owned properties.", "Grow 15% per quarter"),
    ("Publishing frequency", "Flagship assets shipped per month.", "4 per month"),
    ("Paid dependency", "Share of reach bought rather than owned.", "Trending down"),
]

DELIVERABLES = [
    ("Publisher Index score", "A 0–100 diagnostic across six dimensions, with your maturity level."),
    ("The full Blueprint", "Prioritized opportunities, quick wins, and long-term moves — specific to your scores."),
    ("The 90-day plan", "Three phases with objectives, activities, owners, and success metrics."),
    ("KPI framework", "The handful of numbers that prove the work landed."),
    ("Executive readout", "A session and a document your leadership can act on."),
    ("Working sessions", "[CADENCE — e.g. biweekly 60-minute sessions — confirm]"),
]

FIT_YES = [
    "Brand or marketing leader at a $10M–$500M company",
    "You already produce content and it is not compounding",
    "You have budget authority or direct access to it",
    "You want an operating system, not a campaign",
]
FIT_NO = [
    "You need a single campaign executed next week",
    "You want freelance content production",
    "There is no executive sponsor for owned audience",
    "You are looking for the cheapest option",
]


# =========================================================================
# SLIDES
# =========================================================================
def slide_cover(c):
    bg(c, dark=True)
    # maturity-ladder accent
    x = PAGE_W - M - 3.4 * inch
    y = PAGE_H - 1.9 * inch
    for i, w in enumerate([0.9, 1.5, 2.1, 2.75, 3.4]):
        c.setFillColor(Color(0.388, 0.400, 0.945, min(0.16 + i * 0.19, 1)))
        c.rect(x + (3.4 * inch - w * inch), y - i * 0.34 * inch, w * inch,
               0.2 * inch, stroke=0, fill=1)
    y = PAGE_H - 3.5 * inch
    y = para(c, "SIGNATURE ENGAGEMENT", S["kicker"], M, y, 8 * inch) - 16
    y = para(c, OFFER_NAME, S["title_d"], M, y, 8.6 * inch) - 18
    y = para(c, "What the first 90 days deliver — and how we know it worked.",
             S["sub_d"], M, y, 7.6 * inch)
    c.setFillColor(INDIGO)
    c.rect(M, 1.35 * inch, 1.5 * inch, 3, stroke=0, fill=1)
    c.setFillColor(WHITE)
    c.setFont("BodyMed", 13)
    c.drawString(M, 1.0 * inch, "Jeff Hallstead")
    c.setFillColor(FAINTW)
    c.setFont("Body", 12)
    c.drawString(M, 0.72 * inch, "blueprint.jeffhallstead.com")


def slide_problem(c):
    bg(c)
    y = slide_header(c, "The problem", "Most brands rent their audience.")
    left = (PAGE_W - 2 * M - 0.6 * inch) / 2
    para(c, "You spend to reach people who already know you. Reach resets to zero "
            "the moment the budget stops. Campaigns launch, perform, and disappear — "
            "and next quarter starts from the same place.", S["body"], M, y, left)
    body2 = ("The alternative is not more content. It is an owned audience, a "
             "repeatable publishing system, and a measurement story leadership "
             "believes. That is what compounds.")
    para(c, body2, S["body"], M + left + 0.6 * inch, y, left)

    cards = [("Rented reach", ["Every impression is paid for again"]),
             ("Effort without memory", ["Campaigns reset each quarter"]),
             ("No measurement story", ["Content reads as cost, not asset"])]
    cw = (PAGE_W - 2 * M - 2 * 0.35 * inch) / 3
    cy = 3.0 * inch
    for i, (t, lines) in enumerate(cards):
        card(c, M + i * (cw + 0.35 * inch), cy, cw, 1.5 * inch, t, lines)
    footer(c)


def slide_dimensions(c):
    bg(c)
    y = slide_header(c, "The diagnostic", "Six dimensions decide whether content compounds.")
    para(c, "Every engagement starts with the Publisher Test — a 0–100 index scored "
            "across these six dimensions. It tells us where the constraint actually is "
            "before anyone proposes work.", S["body"], M, y, 9.5 * inch)
    cw = (PAGE_W - 2 * M - 2 * 0.32 * inch) / 3
    top = 3.85 * inch
    for i, (name, desc) in enumerate(DIMENSIONS):
        col, row = i % 3, i // 3
        card(c, M + col * (cw + 0.32 * inch), top - row * 1.45 * inch, cw,
             1.25 * inch, name, [desc])
    footer(c)


def slide_levels(c):
    bg(c, dark=True)
    y = slide_header(c, "The ladder", "Five levels of publisher maturity.", dark=True)
    para(c, "Your score places you on this ladder. The engagement is calibrated to the "
            "rung you are on — the plan for a Publisher is not the plan for a Studio.",
         S["body_d"], M, y, 9.5 * inch)
    cw = (PAGE_W - 2 * M - 4 * 0.25 * inch) / 5
    top = 3.7 * inch
    for i, (num, name, rng) in enumerate(LEVELS):
        x = M + i * (cw + 0.25 * inch)
        c.setFillColor(HexColor("#141419"))
        c.setStrokeColor(HexColor("#26262e"))
        c.roundRect(x, top - 1.7 * inch, cw, 1.7 * inch, 8, stroke=1, fill=1)
        c.setFillColor(Color(0.388, 0.400, 0.945, min(0.3 + i * 0.17, 1)))
        c.rect(x, top - 1.7 * inch, cw, 4, stroke=0, fill=1)
        yy = top - 0.42 * inch
        c.setFillColor(INDIGO)
        c.setFont("Display", 26)
        c.drawString(x + 18, yy, num)
        yy = para(c, name, S["cardh_d"], x + 18, yy - 12, cw - 36) - 8
        para(c, f"Score {rng}", S["cardb_d"], x + 18, yy, cw - 36)
    footer(c, dark=True)


def slide_personas(c):
    bg(c)
    y = slide_header(c, "The patterns", "Which one sounds like you?")
    para(c, "Thousands of score combinations resolve into a small number of recognizable "
            "patterns. Naming yours is the first thing we do together.", S["body"], M, y,
         9.5 * inch)
    cw = (PAGE_W - 2 * M - 2 * 0.32 * inch) / 3
    top = 3.85 * inch
    for i, (name, desc) in enumerate(PERSONAS):
        col, row = i % 3, i // 3
        card(c, M + col * (cw + 0.32 * inch), top - row * 1.45 * inch, cw,
             1.25 * inch, name, [desc])
    footer(c)


def slide_how(c):
    bg(c)
    y = slide_header(c, "How it works", "Diagnose. Blueprint. Run.")
    steps = [
        ("01", "Diagnose", "You take the Publisher Test. Fifteen minutes, no cost, "
                           "no obligation. It scores six dimensions and places you on "
                           "the maturity ladder."),
        ("02", "Blueprint", "I build and present your Blueprint: the pattern you fit, "
                            "your ranked opportunities, and a 90-day plan calibrated to "
                            "your level."),
        ("03", "Run", "We execute it together over three phases, with working sessions "
                      "and a metric attached to every phase."),
    ]
    cw = (PAGE_W - 2 * M - 2 * 0.4 * inch) / 3
    top = y + 0.1 * inch
    for i, (num, title, desc) in enumerate(steps):
        x = M + i * (cw + 0.4 * inch)
        c.setFillColor(INDIGO_SOFT)
        c.roundRect(x, top - 2.9 * inch, cw, 2.9 * inch, 10, stroke=0, fill=1)
        c.setFillColor(INDIGO)
        c.rect(x, top - 2.9 * inch, 3, 2.9 * inch, stroke=0, fill=1)
        yy = top - 0.55 * inch
        c.setFillColor(INDIGO)
        c.setFont("Display", 26)
        c.drawString(x + 22, yy, num)
        yy = para(c, title, S["cardh"], x + 22, yy - 14, cw - 44) - 10
        para(c, desc, S["cardb"], x + 22, yy, cw - 44)
    footer(c)


def slide_phase(c, ph, index):
    bg(c)
    y = slide_header(c, f"{ph['days']}  ·  Phase {index} of 3", ph["phase"])
    para(c, ph["objective"], S["sub"], M, y + 8, 9.8 * inch)

    top = 3.95 * inch
    lw = 6.1 * inch
    rw = PAGE_W - 2 * M - lw - 0.45 * inch
    rx = M + lw + 0.45 * inch

    yy = para(c, "WHAT WE DO", S["label"], M, top, lw) - 12
    bullets(c, ph["activities"], S["body"], M, yy, lw, gap=4)

    yy = para(c, "HOW WE MEASURE IT", S["label"], rx, top, rw) - 12
    for m in ph["metrics"]:
        p = Paragraph(m, S["cardb"])
        _, h = p.wrapOn(c, rw - 34, PAGE_H)
        c.setFillColor(HexColor("#fafafc"))
        c.setStrokeColor(RULE)
        c.roundRect(rx, yy - h - 18, rw, h + 18, 6, stroke=1, fill=1)
        c.setFillColor(INDIGO)
        c.circle(rx + 13, yy - h / 2 - 9, 3.2, stroke=0, fill=1)
        p.drawOn(c, rx + 26, yy - h - 9)
        yy -= h + 26

    c.setFillColor(OBSIDIAN)
    c.roundRect(M, 0.95 * inch, PAGE_W - 2 * M, 0.95 * inch, 8, stroke=0, fill=1)
    c.setFillColor(INDIGO)
    c.setFont("BodyBold", 9.5)
    c.drawString(M + 20, 1.58 * inch, "YOU WALK AWAY WITH")
    c.setFillColor(WHITE)
    c.setFont("Body", 14)
    c.drawString(M + 20, 1.28 * inch, ph["deliverable"])
    footer(c)


def slide_calibration(c):
    bg(c, dark=True)
    y = slide_header(c, "Calibration", "The same three phases, tuned to your level.", dark=True)
    para(c, "The phase structure never changes. What changes is what goes inside it — "
            "the plan is generated from your scores, not selected from a shelf.",
         S["body_d"], M, y, 9.6 * inch)
    rows = [
        ("Observer / Publisher", "Stand up one owned channel, prove a cadence, "
                                 "and earn the next round of investment."),
        ("Studio", "Concentrate behind the highest-yield franchise, scale throughput, "
                   "and tie audience growth to pipeline."),
        ("Media Brand / Category Leader", "Govern the audience as a business asset, "
                                          "extend the franchise, and defend the moat."),
    ]
    top = 3.9 * inch
    cw = (PAGE_W - 2 * M - 2 * 0.32 * inch) / 3
    for i, (t, d) in enumerate(rows):
        card(c, M + i * (cw + 0.32 * inch), top, cw, 2.0 * inch, t, [d], dark=True,
             badge="Level " + ["1–2", "3", "4–5"][i])
    footer(c, dark=True)


def slide_deliverables(c):
    bg(c)
    y = slide_header(c, "Deliverables", "What you walk away with.")
    cw = (PAGE_W - 2 * M - 0.45 * inch) / 2
    top = y + 0.1 * inch
    for i, (t, d) in enumerate(DELIVERABLES):
        col, row = i % 2, i // 2
        x = M + col * (cw + 0.45 * inch)
        yy = top - row * 1.28 * inch
        c.setFillColor(INDIGO)
        c.circle(x + 7, yy - 9, 5, stroke=0, fill=1)
        y2 = para(c, t, S["cardh"], x + 24, yy, cw - 24) - 6
        para(c, d, S["cardb"], x + 24, y2, cw - 24)
    footer(c)


def slide_kpis(c):
    bg(c)
    y = slide_header(c, "Proof", "How we know it worked.")
    para(c, "Targets shown are the standard framing for a mid-maturity engagement; "
            "yours are set against your own baseline in phase one.", S["body"], M, y,
         9.6 * inch)
    top = 3.75 * inch
    x0, w = M, PAGE_W - 2 * M
    c1, c2, c3 = 3.1 * inch, w - 3.1 * inch - 2.5 * inch, 2.5 * inch
    c.setFillColor(INK)
    c.rect(x0, top, w, 0.4 * inch, stroke=0, fill=1)
    c.setFillColor(WHITE)
    c.setFont("BodyBold", 11)
    c.drawString(x0 + 14, top + 0.14 * inch, "METRIC")
    c.drawString(x0 + c1 + 14, top + 0.14 * inch, "WHAT IT MEASURES")
    c.drawString(x0 + c1 + c2 + 14, top + 0.14 * inch, "TARGET FRAMING")
    yy = top
    for i, (label, desc, target) in enumerate(KPIS):
        rh = 0.46 * inch
        if i % 2 == 0:
            c.setFillColor(HexColor("#fafafc"))
            c.rect(x0, yy - rh, w, rh, stroke=0, fill=1)
        c.setStrokeColor(RULE)
        c.setLineWidth(0.4)
        c.line(x0, yy - rh, x0 + w, yy - rh)
        c.setFillColor(INK)
        c.setFont("BodyMed", 12)
        c.drawString(x0 + 14, yy - 0.3 * inch, label)
        c.setFillColor(MUTED)
        c.setFont("Body", 11.5)
        c.drawString(x0 + c1 + 14, yy - 0.3 * inch, desc)
        c.setFillColor(INDIGO)
        c.setFont("BodyBold", 11.5)
        c.drawString(x0 + c1 + c2 + 14, yy - 0.3 * inch, target)
        yy -= rh
    footer(c)


def slide_fit(c):
    bg(c)
    y = slide_header(c, "Fit", "Who this is for — and who it is not.")
    cw = (PAGE_W - 2 * M - 0.5 * inch) / 2
    top = y + 0.1 * inch
    c.setFillColor(INDIGO_SOFT)
    c.roundRect(M, top - 3.0 * inch, cw, 3.0 * inch, 10, stroke=0, fill=1)
    c.setFillColor(HexColor("#f6f6f8"))
    c.roundRect(M + cw + 0.5 * inch, top - 3.0 * inch, cw, 3.0 * inch, 10, stroke=0, fill=1)

    yy = para(c, "A GOOD FIT", S["label"], M + 24, top - 0.35 * inch, cw - 48) - 14
    bullets(c, FIT_YES, S["body"], M + 24, yy, cw - 48, gap=6)

    x2 = M + cw + 0.5 * inch + 24
    yy = para(c, "NOT A FIT", ParagraphStyle("l2", parent=S["label"], textColor=MUTED),
              x2, top - 0.35 * inch, cw - 48) - 14
    bullets(c, FIT_NO, ParagraphStyle("b2", parent=S["body"], textColor=MUTED),
            x2, yy, cw - 48, gap=6)
    footer(c)


def slide_why(c):
    bg(c, dark=True)
    y = slide_header(c, "Why me", "I ran newsrooms before I advised brands.", dark=True)
    para(c, "Most content consultants come from agencies. I come from media — which is "
            "why the plan you get is a publishing operation, not a campaign calendar. "
            "The Blueprint you will see on our call is the same system I use with every "
            "client.", S["body_d"], M, y, 9.4 * inch)
    stats = [("[YEARS]", "Years in media and publishing leadership"),
             ("[N]", "Brand and publisher engagements led"),
             ("[PROOF]", "Representative client outcome — to confirm")]
    cw = (PAGE_W - 2 * M - 2 * 0.32 * inch) / 3
    top = 3.5 * inch
    for i, (big, lbl) in enumerate(stats):
        x = M + i * (cw + 0.32 * inch)
        c.setFillColor(HexColor("#141419"))
        c.setStrokeColor(HexColor("#26262e"))
        c.roundRect(x, top - 1.7 * inch, cw, 1.7 * inch, 8, stroke=1, fill=1)
        c.setFillColor(INDIGO)
        c.setFont("Display", 30)
        c.drawString(x + 20, top - 0.75 * inch, big)
        para(c, lbl, S["cardb_d"], x + 20, top - 0.95 * inch, cw - 40)
    footer(c, dark=True)


def slide_start(c):
    bg(c)
    y = slide_header(c, "Getting started", "Two steps, and the first one is free.")
    steps = [("Take the Publisher Test", "Fifteen minutes at blueprint.jeffhallstead.com. "
                                         "You get your Publisher Index score immediately."),
             ("We walk your Blueprint together", "A working session where I present your "
                                                 "pattern, your gaps, and the 90-day plan. "
                                                 "You leave with the plan whether or not we "
                                                 "work together.")]
    cw = (PAGE_W - 2 * M - 0.5 * inch) / 2
    top = y + 0.1 * inch
    for i, (t, d) in enumerate(steps):
        x = M + i * (cw + 0.5 * inch)
        c.setFillColor(HexColor("#fafafc"))
        c.setStrokeColor(RULE)
        c.roundRect(x, top - 2.4 * inch, cw, 2.4 * inch, 10, stroke=1, fill=1)
        c.setFillColor(INDIGO)
        c.setFont("Display", 26)
        c.drawString(x + 24, top - 0.62 * inch, f"0{i + 1}")
        yy = para(c, t, S["cardh"], x + 24, top - 0.78 * inch, cw - 48) - 10
        para(c, d, S["cardb"], x + 24, yy, cw - 48)

    c.setFillColor(INDIGO_SOFT)
    c.roundRect(M, 0.95 * inch, PAGE_W - 2 * M, 0.9 * inch, 8, stroke=0, fill=1)
    c.setFillColor(INK)
    c.setFont("BodyMed", 14)
    c.drawString(M + 20, 1.5 * inch, "Engagement investment")
    c.setFillColor(INDIGO)
    c.setFont("BodyBold", 14)
    c.drawString(M + 20, 1.2 * inch, "[PRICE — confirm]  ·  [DURATION / SESSION CADENCE — confirm]")
    footer(c)


def slide_close(c):
    bg(c, dark=True)
    y = PAGE_H - 3.2 * inch
    y = para(c, "NEXT STEP", S["kicker"], M, y, 9 * inch) - 14
    y = para(c, "Let's find out where your\naudience actually stands.", S["title_d"], M, y,
             9 * inch) - 20
    para(c, "blueprint.jeffhallstead.com  ·  jeffhallstead.com/contact", S["sub_d"], M, y,
         9 * inch)
    c.setFillColor(INDIGO)
    c.rect(M, 1.35 * inch, 1.5 * inch, 3, stroke=0, fill=1)
    c.setFillColor(WHITE)
    c.setFont("BodyMed", 13)
    c.drawString(M, 1.0 * inch, "Jeff Hallstead")
    c.setFillColor(FAINTW)
    c.setFont("Body", 12)
    c.drawString(M, 0.72 * inch, OFFER_NAME)


def main():
    global S
    ensure_fonts()
    S.update(styles())
    os.makedirs(os.path.dirname(OUT_PDF), exist_ok=True)
    c = pdfcanvas.Canvas(OUT_PDF, pagesize=(PAGE_W, PAGE_H))
    c.setTitle("The Publisher Engagement — Signature Offer")
    c.setAuthor("Jeff Hallstead")

    slides = [slide_cover, slide_problem, slide_dimensions, slide_levels,
              slide_personas, slide_how]
    for fn in slides:
        fn(c)
        c.showPage()
    for i, ph in enumerate(PHASES):
        slide_phase(c, ph, i + 1)
        c.showPage()
    for fn in [slide_calibration, slide_deliverables, slide_kpis, slide_fit,
               slide_why, slide_start, slide_close]:
        fn(c)
        c.showPage()
    c.save()
    print("wrote", OUT_PDF)


if __name__ == "__main__":
    main()
