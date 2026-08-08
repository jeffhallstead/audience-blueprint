#!/usr/bin/env python3
"""
Builds "The Publisher Blueprint Guide" — a short, designed PDF ebook derived
from the live Publisher Blueprint engine (maturity levels in
src/lib/assessment/config.ts, categories, roadmap templates and KPIs in
src/lib/blueprint/rules.ts) and the behavioral personas in
docs/Customer-Personas.md.

Content lives in the CONTENT structures below so copy can be edited in one
place. The script emits:
  - /mnt/documents/publisher-blueprint-guide.pdf   (the deliverable)
  - docs/Publisher-Blueprint-Guide.md              (editable manuscript)

Run: python3 scripts/build-guide.py
"""

import os
import subprocess
import sys

from reportlab.lib.colors import HexColor, Color
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

_ReportlabParagraph = Paragraph


def Paragraph(text, style, **kw):  # noqa: N802 - shadows platypus Paragraph on purpose
    """Map <b> to the registered Plus Jakarta bold face (family bold lookup is
    unreliable for the instanced variable fonts we register)."""
    text = text.replace("<b>", '<font name="BodyBold">').replace("</b>", "</font>")
    return _ReportlabParagraph(text, style, **kw)


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_PDF = "/mnt/documents/publisher-blueprint-guide.pdf"
OUT_MD = os.path.join(ROOT, "docs", "Publisher-Blueprint-Guide.md")
FONT_DIR = "/tmp/guide-fonts"

# --- Brand palette (from src/styles.css) ---------------------------------
OBSIDIAN = HexColor("#09090b")
INK = HexColor("#141417")
BODY = HexColor("#33333a")
MUTED = HexColor("#6b6b76")
INDIGO = HexColor("#6366f1")
INDIGO_SOFT = HexColor("#eeeefe")
RULE = HexColor("#e3e3ea")
PAPER = HexColor("#ffffff")
WHITE = HexColor("#ffffff")
DIM = Color(1, 1, 1, 0.62)

PAGE_W, PAGE_H = letter
MARGIN = 0.95 * inch


# --- Fonts ---------------------------------------------------------------
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
                    # Unique PostScript/family names per instance. Without this
                    # every instance keeps the variable font's name and ReportLab
                    # collapses them into one embedded face (all weights render
                    # identically).
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
    pdfmetrics.registerFontFamily("Body", normal="Body", bold="BodyBold", italic="Body", boldItalic="BodyBold")


# --- Styles --------------------------------------------------------------
def styles():
    s = {}
    s["h1"] = ParagraphStyle("h1", fontName="Display", fontSize=27, leading=31,
                             textColor=INK, spaceAfter=10)
    s["h2"] = ParagraphStyle("h2", fontName="DisplayMed", fontSize=15.5, leading=19,
                             textColor=INK, spaceBefore=15, spaceAfter=6)
    s["h3"] = ParagraphStyle("h3", fontName="BodyBold", fontSize=10.5, leading=14,
                             textColor=INDIGO, spaceBefore=11, spaceAfter=3)
    s["eyebrow"] = ParagraphStyle("eyebrow", fontName="BodyBold", fontSize=8,
                                  leading=10, textColor=INDIGO, spaceAfter=7)
    s["body"] = ParagraphStyle("body", fontName="Body", fontSize=10.2, leading=15.6,
                               textColor=BODY, spaceAfter=8, alignment=TA_LEFT)
    s["lead"] = ParagraphStyle("lead", fontName="Body", fontSize=12, leading=18,
                               textColor=INK, spaceAfter=10)
    s["bullet"] = ParagraphStyle("bullet", parent=s["body"], leftIndent=14,
                                 bulletIndent=2, spaceAfter=5)
    s["small"] = ParagraphStyle("small", fontName="Body", fontSize=8.6, leading=12.4,
                                textColor=MUTED, spaceAfter=6)
    s["cellh"] = ParagraphStyle("cellh", fontName="BodyBold", fontSize=8.8, leading=12,
                                textColor=WHITE)
    s["cell"] = ParagraphStyle("cell", fontName="Body", fontSize=8.8, leading=12.4,
                               textColor=BODY)
    s["cellb"] = ParagraphStyle("cellb", fontName="BodyBold", fontSize=8.8, leading=12.4,
                                textColor=INK)
    # Dark-page styles
    s["dh1"] = ParagraphStyle("dh1", fontName="Display", fontSize=34, leading=38,
                              textColor=WHITE, spaceAfter=12)
    s["dbody"] = ParagraphStyle("dbody", fontName="Body", fontSize=11, leading=17,
                                textColor=DIM, spaceAfter=9)
    s["deyebrow"] = ParagraphStyle("deyebrow", fontName="BodyBold", fontSize=8.5,
                                   leading=11, textColor=INDIGO, spaceAfter=10)
    return s


S = None  # populated in main


# --- Page decoration -----------------------------------------------------
def light_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    # running head
    canvas.setFont("BodyMed", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN, PAGE_H - 0.62 * inch, "THE PUBLISHER BLUEPRINT GUIDE")
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, PAGE_H - 0.72 * inch, PAGE_W - MARGIN, PAGE_H - 0.72 * inch)
    # footer
    n = canvas.getPageNumber()
    canvas.setFont("Body", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN, 0.6 * inch, "Jeff Hallstead")
    canvas.setFillColor(INK)
    canvas.setFont("BodyMed", 8)
    canvas.drawRightString(PAGE_W - MARGIN, 0.6 * inch, str(n))
    canvas.restoreState()


def dark_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(OBSIDIAN)
    canvas.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    canvas.setFillColor(INDIGO)
    canvas.rect(0, PAGE_H - 6, PAGE_W, 6, stroke=0, fill=1)
    canvas.setFont("Body", 8)
    canvas.setFillColor(Color(1, 1, 1, 0.4))
    canvas.drawString(MARGIN, 0.6 * inch, "The Publisher Blueprint Guide")
    canvas.drawRightString(PAGE_W - MARGIN, 0.6 * inch, str(canvas.getPageNumber()))
    canvas.restoreState()


def cover_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(OBSIDIAN)
    canvas.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    # accent geometry: stacked bars suggesting a maturity ladder
    x = PAGE_W - MARGIN - 2.5 * inch
    y = PAGE_H - 2.15 * inch
    widths = [0.7, 1.15, 1.6, 2.05, 2.5]
    for i, w in enumerate(widths):
        alpha = 0.16 + i * 0.19
        canvas.setFillColor(Color(0.388, 0.400, 0.945, min(alpha, 1)))
        canvas.rect(x + (2.5 * inch - w * inch), y - i * 0.26 * inch,
                    w * inch, 0.16 * inch, stroke=0, fill=1)
    canvas.setFillColor(INDIGO)
    canvas.rect(MARGIN, 1.02 * inch, 1.35 * inch, 3, stroke=0, fill=1)
    canvas.restoreState()


# --- Drawing helpers -----------------------------------------------------
def bullets(items, style=None):
    st = style or S["bullet"]
    return [Paragraph(t, st, bulletText="•") for t in items]


def rule_line(color=RULE, space_before=6, space_after=8, width=None):
    t = Table([[""]], colWidths=[width or (PAGE_W - 2 * MARGIN)], rowHeights=[0.6])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), color),
                           ("TOPPADDING", (0, 0), (-1, -1), 0),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    return [Spacer(1, space_before), t, Spacer(1, space_after)]


def data_table(rows, col_widths, header=True, zebra=True):
    body = []
    for r_i, row in enumerate(rows):
        cells = []
        for c in row:
            if r_i == 0 and header:
                cells.append(Paragraph(c, S["cellh"]))
            else:
                cells.append(Paragraph(c, S["cell"]))
        body.append(cells)
    t = Table(body, colWidths=col_widths, repeatRows=1 if header else 0)
    style = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, RULE),
    ]
    if header:
        style.append(("BACKGROUND", (0, 0), (-1, 0), INK))
    if zebra:
        for i in range(1 if header else 0, len(body)):
            if i % 2 == (1 if header else 0):
                style.append(("BACKGROUND", (0, i), (-1, i), HexColor("#fafafc")))
    t.setStyle(TableStyle(style))
    return t


def callout(title, text, tint=INDIGO_SOFT):
    inner = [Paragraph(title, ParagraphStyle("ct", fontName="BodyBold", fontSize=9.4,
                                             leading=13, textColor=INK, spaceAfter=4)),
             Paragraph(text, ParagraphStyle("cb", fontName="Body", fontSize=9.4,
                                            leading=14, textColor=BODY))]
    t = Table([[inner]], colWidths=[PAGE_W - 2 * MARGIN])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), tint),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 11),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 11),
        ("LINEBEFORE", (0, 0), (0, -1), 2.5, INDIGO),
    ]))
    return t


def score_boxes(count=5):
    """Row of empty score checkboxes 1-5 for the worksheet."""
    cells = [Paragraph(str(i), ParagraphStyle("sb", fontName="BodyMed", fontSize=8.4,
                                              leading=11, textColor=MUTED,
                                              alignment=1)) for i in range(1, count + 1)]
    t = Table([cells], colWidths=[0.28 * inch] * count, rowHeights=[0.24 * inch])
    t.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, RULE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    return t


# =========================================================================
# CONTENT
# =========================================================================

DIMENSIONS = [
    ("Audience", "1.2",
     "The first-party audience you own and can reach without permission from a platform.",
     "Do you have a list you control, is it growing, and can you segment it?"),
    ("Content", "1.1",
     "Editorial capability, original IP, and the formats you can sustain.",
     "Can you ship a recurring format without heroics, and does anything you make belong to you?"),
    ("Distribution", "1.0",
     "How reliably work reaches the right audience without paid dependency.",
     "If your largest channel halved tomorrow, what share of your reach survives?"),
    ("Operations", "1.0",
     "Team, workflow, documentation, AI adoption, and measurement discipline.",
     "Is the process written down, and does it survive a person leaving?"),
    ("Strategy", "0.8",
     "Clarity of objectives and the ambition behind the publishing motion.",
     "Can you state in one sentence who you publish for and what you promise them?"),
    ("Alignment", "0.9",
     "Executive support, budget, and cross-functional commitment.",
     "Does leadership treat content as an asset or as a line item to cut?"),
]

LEVELS = [
    ("1", "Observer", "0–34", "Still relying primarily on campaigns and rented audiences.",
     ["Publishing is campaign-driven and episodic",
      "Reach depends on platforms and paid media",
      "First-party data is thin or fragmented"],
     "Establish an owned audience beachhead before adding production volume."),
    ("2", "Publisher", "35–54", "Publishing consistently but lacking repeatable systems.",
     ["A steady cadence exists on at least one channel",
      "Process lives with individuals rather than in playbooks",
      "Measurement is activity-based, not outcome-based"],
     "Convert individual effort into a documented operating system."),
    ("3", "Studio", "55–71", "Developing original IP and repeatable content operations.",
     ["Recurring formats and original IP are in market",
      "A dedicated team runs a predictable calendar",
      "Owned audience growth is tracked deliberately"],
     "Deepen audience ownership and tie output to pipeline."),
    ("4", "Media Brand", "72–85", "Content drives measurable business outcomes and audience growth.",
     ["Owned distribution rivals or exceeds paid reach",
      "Leadership reviews audience metrics alongside revenue",
      "Formats compound rather than reset each quarter"],
     "Scale the franchise portfolio and defend the audience relationship."),
    ("5", "Category Leader", "86+", "Content has become a strategic business asset and competitive advantage.",
     ["The audience is a durable, defensible asset",
      "Content shapes category narrative and demand",
      "Publishing economics are understood at board level"],
     "Protect the moat and monetize the audience beyond demand generation."),
]

PERSONAS = [
    {
        "n": "01", "name": "Paid Media Plateau",
        "sig": "Publisher level · Distribution weakest",
        "who": "VP Marketing or CMO at a $25M–$150M consumer brand. Performance marketing built the company; the CAC curve has now bent the wrong way for six straight quarters.",
        "trap": "You treat the problem as a creative problem. You brief a new agency, refresh the assets, test new hooks — and the curve keeps bending, because the issue is not the work. Every view is rented, and the rent goes up.",
        "moves": [
            "Inventory every channel and write down what share of reach you would keep if the largest one disappeared. That number is your real distribution position.",
            "Put a newsletter signup path on every owned property this month, then consolidate the lists you already have into one governed source.",
            "Rebuild the media plan around one owned destination. Paid buys the first visit; the list buys the second and every one after it.",
        ],
        "ignore": "A new brand platform, a rebrand, or another agency review. None of them change who owns the audience.",
        "know": "You have hit this level when a measurable share of your monthly reach comes from people you can contact directly, and you can quote that share from memory.",
    },
    {
        "n": "02", "name": "Campaign Factory",
        "sig": "Publisher level · Operations weakest",
        "who": "VP Marketing or Senior Director at a $10M–$100M brand with a busy, capable team and no editorial system. Output is high and unrepeatable.",
        "trap": "Everything ships and nothing compounds. Process lives in individual heads, measurement is activity-based — impressions and posts — so nobody can defend the content line when budget review arrives.",
        "moves": [
            "Publish a fixed weekly slot for four consecutive weeks. Not more volume — the same slot, on time, four times.",
            "Document the workflow from brief to publish and name one accountable editor with protected weekly time.",
            "Replace impressions with two outcome metrics your CFO already recognizes, and report them monthly whether the news is good or not.",
        ],
        "ignore": "New tools. A calendar app does not create a cadence; a named owner does.",
        "know": "You have hit this level when someone can go on leave and the slot still ships.",
    },
    {
        "n": "03", "name": "Orphaned Audience",
        "sig": "Publisher or Studio level · Audience weakest, content strong",
        "who": "Brand Director or Head of Content at a $50M–$500M consumer brand with a real content library and no direct relationship with the people consuming it.",
        "trap": "Good work with no home. Followers sit on platforms you do not control, the email list is split across three tools, and first-party data is thin. An algorithm change is an existential risk and everyone knows it.",
        "moves": [
            "Consolidate every list, form, and export into one system of record. Do this before you make anything new.",
            "Choose one flagship owned format — newsletter, series, or show — and give it a name, a host, and a schedule.",
            "Audit the back catalog and re-cut the top ten pieces into the owned format. You already paid for that content once.",
        ],
        "ignore": "Follower-count goals on any platform you do not control.",
        "know": "You have hit this level when you can reach the right segment of your audience on a Tuesday without buying media.",
    },
    {
        "n": "04", "name": "Stalled Studio",
        "sig": "Studio level · Operations or alignment weakest",
        "who": "CMO or VP Brand at a $100M–$500M company with a funded content team already in market. Recurring formats exist. Board support does not.",
        "trap": "The function is real but unprotected. Leadership cannot see the return, so the budget gets re-litigated every planning cycle. The gap is not production — it is a measurement narrative.",
        "moves": [
            "Write the board narrative first, then work backwards to the three numbers that support it.",
            "Rank every active format by audience yield and retire the bottom third. Concentration is the argument.",
            "Give leadership a standing monthly audience review with the same three metrics every time. Consistency is what builds belief.",
        ],
        "ignore": "Attribution perfection. A defensible directional number reported monthly beats a perfect number reported never.",
        "know": "You have hit this level when the content line survives a planning cycle without being re-argued.",
    },
    {
        "n": "05", "name": "Funded Builder",
        "sig": "Publisher level · Strategy weakest, broad gaps",
        "who": "Founder-adjacent CMO or first marketing leader at a venture- or PE-backed company. Money is available; a plan is not.",
        "trap": "Ambition well ahead of infrastructure. Everything is a candidate priority, so nothing gets sequenced, and the next board meeting arrives without a story.",
        "moves": [
            "Write a one-page publishing thesis: audience, promise, format, north-star metric. One page, not ten.",
            "Pick the two moves you will make this quarter and write down the six you are explicitly not making.",
            "Ship the smallest version of the flagship format before you hire for it.",
        ],
        "ignore": "Hiring a content team before the thesis exists. You will hire against the wrong shape.",
        "know": "You have hit this level when you can say no to a good idea and give the reason in one sentence.",
    },
    {
        "n": "06", "name": "Curious Observer",
        "sig": "Observer level · Most dimensions critical",
        "who": "Marketing manager, solo operator, or a leader at a company under $10M. Genuinely early — and that is fine.",
        "trap": "Trying to be everywhere at once. Campaign-driven and episodic, reach entirely dependent on platforms and paid media, first-party data close to nonexistent.",
        "moves": [
            "Choose exactly one owned channel and commit to it for two quarters. One.",
            "Add a single signup path and record your starting subscriber number today so you have a baseline.",
            "Publish on the same day every week. Frequency matters far less than predictability.",
        ],
        "ignore": "Every platform you are not committing to this quarter.",
        "know": "You have hit this level when the cadence holds for eight weeks without a rescue.",
    },
    {
        "n": "07", "name": "Internal Champion",
        "sig": "Any level · High engagement, no budget authority",
        "who": "A content lead, senior manager, or strategist who already believes and does not hold the budget.",
        "trap": "Building the case alone. You keep gathering more evidence when what is missing is a sponsor, not another slide.",
        "moves": [
            "Turn the diagnostic into one page in your leadership's language: risk, cost, and the first 90 days.",
            "Name the single executive whose problem this solves and lead with their problem, not the framework.",
            "Ask for a small, specific, reversible first commitment rather than a program.",
        ],
        "ignore": "A full strategy deck. Nobody approves a program they have not first agreed has a problem.",
        "know": "You have hit this level when someone above you starts asking about the numbers unprompted.",
    },
    {
        "n": "08", "name": "Category Leader",
        "sig": "Media Brand or Category Leader level · Few gaps",
        "who": "A brand that has already built the function. Owned distribution rivals or exceeds paid reach, and content shapes the category narrative.",
        "trap": "Complacency dressed as maturity. The moat is real, but audience assets decay quietly — retention slips a point a quarter and nobody notices for a year.",
        "moves": [
            "Set retention and engagement targets for the audience the same way you would for a product.",
            "Extend the flagship into one adjacent format with shared audience economics rather than launching something new.",
            "Give the audience its own line in the plan with growth and retention numbers attached.",
        ],
        "ignore": "Volume goals. At this level, more output is the easiest way to dilute what already works.",
        "know": "You have hit this level when the audience is discussed at board level as an asset with a value, not a channel with a cost.",
    },
]

ROADMAP = [
    ("Month 1", "Stabilize",
     "Stop the leak and pick the one thing.",
     ["Write the one-page publishing thesis: audience, promise, format, north-star metric",
      "Appoint an accountable owner with named, protected weekly time",
      "Consolidate every existing list into one governed source",
      "Record today's baseline numbers before you change anything"],
     "Thesis approved · owner named · baseline recorded"),
    ("Month 2", "Build",
     "Prove the cadence can be sustained by a system, not by heroics.",
     ["Publish on a fixed cadence for four consecutive weeks",
      "Document the workflow from brief to publish",
      "Instrument where subscribers actually come from",
      "Run a weekly slate review with a single decision-maker"],
     "4/4 weeks shipped · workflow documented · source tracking live"),
    ("Month 3", "Compound",
     "Turn evidence into the next horizon of investment.",
     ["Review engagement and retention data; cut the weakest segment",
      "Interview ten members of the audience and sharpen the promise",
      "Package results into an executive review with a 12-month ask",
      "Choose the flagship format to commission next quarter"],
     "Engaged-reach baseline reported · executive review delivered · next budget confirmed"),
]

KPIS = [
    ("Observer / Publisher", [
        ("Newsletter subscribers", "Total confirmed first-party subscribers", "Establish baseline"),
        ("Signup conversion rate", "Visitors who join the owned list", "1.5% of sessions"),
        ("Publishing consistency", "Scheduled slots shipped on time", "100% of slots"),
        ("First-party audience size", "Contactable, consented individuals", "Grow 10% monthly"),
    ]),
    ("Studio", [
        ("Email growth rate", "Net new subscribers month over month", "8–12% monthly"),
        ("Engaged reach", "Audience with a meaningful interaction in 30 days", "35% of list"),
        ("Returning visitors", "Share of visits from known audience", "40% of sessions"),
        ("Publishing frequency", "Flagship assets shipped per month", "4 per month"),
    ]),
    ("Media Brand / Category Leader", [
        ("Subscriber retention", "Twelve-month audience retention", "80%+"),
        ("Pipeline influence", "Opportunities touched by owned audience", "20% of pipeline"),
        ("Lead generation", "Qualified leads sourced from owned channels", "25% of MQLs"),
        ("Paid dependency", "Share of reach bought rather than owned", "Below 40%"),
    ]),
]

FAILURES = [
    ("Volume as strategy",
     "More posts, more channels, more formats — activity mistaken for progress. Output rises, owned audience does not.",
     "Cut the slate by a third and put the recovered time into one format."),
    ("The orphaned relaunch",
     "A beautiful new property launches, gets three months of attention, then quietly stops. Nobody owned the slot after launch week.",
     "Name the owner and the cadence before you name the property."),
    ("Measuring the wrong thing",
     "Impressions and follower counts are reported because they are easy, so leadership never sees anything that behaves like an asset.",
     "Pick two outcome metrics, report them monthly, and never change them mid-year."),
    ("Rented land expansion",
     "Every new channel is somebody else's. Reach grows and fragility grows faster.",
     "For every platform you add, add one owned capture path that feeds the list."),
    ("The hero dependency",
     "One person holds the whole operation. It works beautifully until they take a holiday.",
     "Write the workflow down this quarter, not when they resign."),
    ("Sequencing everything at once",
     "Eight priorities, all urgent, none finished. Common in well-funded teams.",
     "Two priorities per quarter, in writing, with the rejected six listed underneath."),
]


# =========================================================================
# PDF BUILD
# =========================================================================
def build_pdf():
    doc = BaseDocTemplate(
        OUT_PDF, pagesize=letter,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN, bottomMargin=0.9 * inch,
        title="The Publisher Blueprint Guide",
        author="Jeff Hallstead",
        subject="A field guide to building an owned audience",
    )
    content_w = PAGE_W - 2 * MARGIN
    frame_light = Frame(MARGIN, 0.9 * inch, content_w, PAGE_H - MARGIN - 0.9 * inch - 0.18 * inch,
                        id="light", showBoundary=0)
    frame_dark = Frame(MARGIN, 1.4 * inch, content_w, PAGE_H - 2.9 * inch, id="dark")
    frame_cover = Frame(MARGIN, 1.35 * inch, content_w - 0.3 * inch, PAGE_H - 3.9 * inch, id="cover")

    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[frame_cover], onPage=cover_page),
        PageTemplate(id="light", frames=[frame_light], onPage=light_page),
        PageTemplate(id="dark", frames=[frame_dark], onPage=dark_page),
    ])

    f = []
    W = content_w

    # ---------- 1. Cover ----------
    f.append(Spacer(1, 2.4 * inch))
    f.append(Paragraph("A FIELD GUIDE FOR BRAND AND MARKETING LEADERS", S["deyebrow"]))
    f.append(Paragraph("The Publisher<br/>Blueprint Guide", S["dh1"]))
    f.append(Spacer(1, 6))
    f.append(Paragraph(
        "How to find out whether you own your audience — and the six moves that "
        "change the answer in 90 days.",
        ParagraphStyle("sub", fontName="DisplayLight", fontSize=13.5, leading=20,
                       textColor=Color(1, 1, 1, 0.58))))
    f.append(Spacer(1, 0.9 * inch))
    f.append(Paragraph("Jeff Hallstead", ParagraphStyle("auth", fontName="DisplayMed",
                                                        fontSize=12.5, leading=16, textColor=WHITE)))
    f.append(Paragraph("Built from the Publisher Blueprint diagnostic",
                       ParagraphStyle("authsub", fontName="Body", fontSize=9.2, leading=13,
                                      textColor=Color(1, 1, 1, 0.45))))
    f.append(NextPageTemplate("light"))
    f.append(PageBreak())

    # ---------- 2. The premise ----------
    f.append(Paragraph("THE PREMISE", S["eyebrow"]))
    f.append(Paragraph("Most brands rent their audience", S["h1"]))
    f.append(Paragraph(
        "I spent fifteen years measuring audiences at Nielsen and Comscore, and the years "
        "since inside the media businesses — Warner Bros, Disney, Paramount, NBCUniversal, "
        "Amazon Studios — that brands now say they want to emulate. Then I built the same "
        "function on the brand side. The pattern I see is almost always the same, and it has "
        "very little to do with creative quality.", S["lead"]))
    f.append(Paragraph(
        "A brand builds reach by buying it. That works, so it buys more. Over time the "
        "audience looks like an asset on the org chart and behaves like a lease on the P&amp;L. "
        "The moment the spend stops, the relationship stops. Every quarter the same amount of "
        "money buys slightly less, and the team responds by making better ads — which is the "
        "one thing that cannot fix it.", S["body"]))
    f.append(Paragraph(
        "Media companies solved this a long time ago. They do not buy an audience each "
        "quarter; they build a relationship once and program against it for years. The "
        "mechanics are unglamorous: a promise, a format, a schedule, a list you control, and "
        "a number the finance team recognizes.", S["body"]))
    f.append(Paragraph(
        "That is what this guide is. Not a theory of content marketing — a diagnostic and a "
        "sequence, drawn from the same model that powers the Publisher Blueprint.", S["body"]))
    f.append(Spacer(1, 4))
    f.append(callout(
        "The distinction that matters",
        "Rented reach is reach you must buy again tomorrow. Owned reach is reach you can use "
        "again tomorrow at no additional cost. Almost every strategic decision in this guide "
        "comes down to moving budget from the first column to the second."))
    f.append(PageBreak())

    # ---------- 3. How to use this guide ----------
    f.append(Paragraph("ORIENTATION", S["eyebrow"]))
    f.append(Paragraph("How to use this guide", S["h1"]))
    f.append(Paragraph(
        "This is a working document, not a read-through. Give it forty-five minutes with a pen "
        "and you will finish with a score, a named pattern, and a 90-day sequence.", S["body"]))
    f.append(Paragraph("The four steps", S["h2"]))
    f.extend(bullets([
        "<b>Score yourself.</b> Six dimensions, rated 1 to 5, on the worksheet on page 7. Answer "
        "as your most sceptical colleague would, not as you would like it to be.",
        "<b>Find your level.</b> The total maps to one of five maturity levels, from Observer to "
        "Category Leader. The level tells you what kind of problem you have.",
        "<b>Find your pattern.</b> Your level plus your weakest dimension points to one of eight "
        "behavioral patterns. The pattern tells you what to do about it.",
        "<b>Run the sequence.</b> Three months: stabilize, build, compound. The same shape "
        "regardless of pattern; the content of each month depends on yours.",
    ]))
    f.append(Paragraph("Two rules that make it work", S["h2"]))
    f.extend(bullets([
        "<b>Score honestly or do not score at all.</b> An inflated score produces a plan for a "
        "company you do not run.",
        "<b>One weakest dimension, not three.</b> The whole method depends on picking a single "
        "constraint and fixing it before you move on.",
    ]))
    f.append(Spacer(1, 6))
    f.append(callout(
        "Where this comes from",
        "The levels, dimensions, weights, roadmap phases, and KPI sets in this guide are the "
        "same ones used by the live Publisher Blueprint diagnostic. Nothing here is a "
        "workshop invention; it is the model, written down."))
    f.append(PageBreak())

    # ---------- 4-5. The six dimensions ----------
    f.append(Paragraph("THE MODEL", S["eyebrow"]))
    f.append(Paragraph("The Publisher Index", S["h1"]))
    f.append(Paragraph(
        "The Index scores a publishing operation across six dimensions, gathered through seven "
        "sections of diagnostic questions: company profile, audience ownership, content "
        "capability, distribution, operations, business alignment, and growth goals. Each "
        "dimension carries a weight, because they are not equally load-bearing.", S["body"]))
    f.append(Spacer(1, 4))
    rows = [["Dimension", "Weight", "What it measures"]]
    for name, w, desc, _ in DIMENSIONS:
        rows.append([f"<b>{name}</b>", w, desc])
    f.append(data_table(rows, [1.15 * inch, 0.6 * inch, W - 1.75 * inch]))
    f.append(Spacer(1, 12))
    f.append(Paragraph(
        "Audience carries the heaviest weight because it is the only dimension that cannot be "
        "rented. Strategy carries the lightest not because it matters least, but because a "
        "clear strategy with no audience infrastructure produces nothing you can measure.",
        S["small"]))
    f.append(PageBreak())

    f.append(Paragraph("THE MODEL", S["eyebrow"]))
    f.append(Paragraph("What each dimension is really asking", S["h1"]))
    for name, w, desc, q in DIMENSIONS:
        f.append(KeepTogether([
            Paragraph(name, S["h3"]),
            Paragraph(desc, S["body"]),
            Paragraph(f"<b>The honest question:</b> {q}",
                      ParagraphStyle("q", parent=S["body"], textColor=INK, spaceAfter=2)),
        ]))
    f.append(PageBreak())

    # ---------- 6. Five levels ----------
    f.append(Paragraph("THE MODEL", S["eyebrow"]))
    f.append(Paragraph("The five maturity levels", S["h1"]))
    f.append(Paragraph(
        "The weighted total lands you on one of five levels. Each is a different kind of "
        "problem, not a different amount of the same problem.", S["body"]))
    f.append(Spacer(1, 2))
    for lvl, title, rng, summary, chars, focus in LEVELS:
        block = Table([[
            Paragraph(lvl, ParagraphStyle("lvl", fontName="Display", fontSize=20, leading=22,
                                          textColor=INDIGO, alignment=1)),
            [Paragraph(f"{title} <font color='#6b6b76' size='8.5'>· {rng}</font>",
                       ParagraphStyle("lt", fontName="BodyBold", fontSize=11, leading=14,
                                      textColor=INK, spaceAfter=2)),
             Paragraph(summary, ParagraphStyle("ls", parent=S["body"], spaceAfter=3)),
             Paragraph(f"<b>Focus:</b> {focus}",
                       ParagraphStyle("lf", parent=S["small"], textColor=BODY, spaceAfter=0))],
        ]], colWidths=[0.55 * inch, W - 0.55 * inch])
        block.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (0, 0), 0),
            ("LEFTPADDING", (1, 0), (1, 0), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
            ("LINEBELOW", (0, 0), (-1, -1), 0.4, RULE),
        ]))
        f.append(block)
    f.append(PageBreak())

    # ---------- 7-8. Worksheet ----------
    f.append(Paragraph("WORKSHEET · 1 OF 2", S["eyebrow"]))
    f.append(Paragraph("Score yourself", S["h1"]))
    f.append(Paragraph(
        "Rate each dimension 1 to 5. 1 means none of this is true. 3 means it is partly true "
        "or true in one corner of the business. 5 means it would survive an audit.", S["body"]))
    f.append(Spacer(1, 6))
    for name, w, desc, q in DIMENSIONS:
        row = Table([[
            [Paragraph(f"{name} <font color='#6b6b76' size='8'>(weight {w})</font>",
                       ParagraphStyle("wn", fontName="BodyBold", fontSize=10, leading=13,
                                      textColor=INK, spaceAfter=2)),
             Paragraph(q, ParagraphStyle("wq", parent=S["small"], spaceAfter=0))],
            score_boxes(),
        ]], colWidths=[W - 1.6 * inch, 1.6 * inch])
        row.setStyle(TableStyle([
            ("VALIGN", (0, 0), (0, 0), "TOP"),
            ("VALIGN", (1, 0), (1, 0), "MIDDLE"),
            ("ALIGN", (1, 0), (1, 0), "RIGHT"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("LINEBELOW", (0, 0), (-1, -1), 0.4, RULE),
        ]))
        f.append(row)
    f.append(Spacer(1, 10))
    f.append(callout(
        "Circle your weakest dimension",
        "If two tie, choose the one further left in the list on page 4 — Audience beats "
        "Content, Content beats Distribution, and so on. The heavier weight breaks the tie."))
    f.append(PageBreak())

    f.append(Paragraph("WORKSHEET · 2 OF 2", S["eyebrow"]))
    f.append(Paragraph("Convert to an Index score", S["h1"]))
    f.append(Paragraph(
        "Multiply each rating by its weight, add them up, then divide by 30 and multiply by "
        "100. That approximates the weighted Publisher Index.", S["body"]))
    f.append(Spacer(1, 4))
    rows = [["Dimension", "Rating (1–5)", "Weight", "Weighted"]]
    for name, w, _, _ in DIMENSIONS:
        rows.append([f"<b>{name}</b>", "", w, ""])
    rows.append(["<b>Total</b>", "", "6.0", ""])
    t = data_table(rows, [W - 3.5 * inch, 1.2 * inch, 0.9 * inch, 1.4 * inch])
    f.append(t)
    f.append(Spacer(1, 12))
    f.append(Paragraph("Your Index score = (Total ÷ 30) × 100 = ______",
                       ParagraphStyle("calc", fontName="BodyBold", fontSize=11.5, leading=16,
                                      textColor=INK, spaceAfter=10)))
    rows = [["Index score", "Level", "What it means"]]
    for lvl, title, rng, summary, _, _ in LEVELS:
        rows.append([rng, f"<b>{title}</b>", summary])
    f.append(data_table(rows, [1.05 * inch, 1.35 * inch, W - 2.4 * inch]))
    f.append(Spacer(1, 12))
    f.append(Paragraph(
        "Write both results down before you turn the page: your level, and your weakest "
        "dimension. Together they select your pattern.", S["body"]))
    f.append(PageBreak())

    # ---------- 9. Reading the result ----------
    f.append(Paragraph("INTERPRETATION", S["eyebrow"]))
    f.append(Paragraph("Level × weakest dimension", S["h1"]))
    f.append(Paragraph(
        "Two companies with the same score can need completely different things. The level "
        "sets the ambition; the weakest dimension sets the first move. Find the intersection "
        "below and turn to that pattern.", S["body"]))
    f.append(Spacer(1, 4))
    rows = [
        ["Level", "Weakest dimension", "Your pattern", "Page"],
        ["Publisher", "Distribution", "<b>01 Paid Media Plateau</b>", "11"],
        ["Publisher", "Operations", "<b>02 Campaign Factory</b>", "12"],
        ["Publisher / Studio", "Audience", "<b>03 Orphaned Audience</b>", "13"],
        ["Studio", "Operations or Alignment", "<b>04 Stalled Studio</b>", "14"],
        ["Publisher", "Strategy", "<b>05 Funded Builder</b>", "15"],
        ["Observer", "Most dimensions", "<b>06 Curious Observer</b>", "16"],
        ["Any", "Any (no budget authority)", "<b>07 Internal Champion</b>", "17"],
        ["Media Brand / Cat. Leader", "Few gaps", "<b>08 Category Leader</b>", "18"],
    ]
    f.append(data_table(rows, [1.55 * inch, 1.75 * inch, W - 3.9 * inch, 0.6 * inch]))
    f.append(Spacer(1, 14))
    f.append(callout(
        "These are output clusters, not personality types",
        "The eight patterns were derived by sampling the Blueprint recommendation engine "
        "across 200,000 randomly generated score profiles and tallying which recommendation "
        "sets it actually produced. They are the shapes the model emits, not archetypes "
        "invented in a workshop."))
    f.append(NextPageTemplate("dark"))
    f.append(PageBreak())

    # ---------- 10. Personas divider ----------
    f.append(Spacer(1, 1.6 * inch))
    f.append(Paragraph("SECTION TWO", S["deyebrow"]))
    f.append(Paragraph("The eight<br/>patterns", S["dh1"]))
    f.append(Spacer(1, 8))
    f.append(Paragraph(
        "One page each. Read your own first. Then read the one directly above you — that is "
        "usually where the next twelve months go.", S["dbody"]))
    f.append(NextPageTemplate("light"))
    f.append(PageBreak())

    # ---------- 11-18. Personas ----------
    for p in PERSONAS:
        f.append(Paragraph(f"PATTERN {p['n']}", S["eyebrow"]))
        f.append(Paragraph(p["name"], S["h1"]))
        f.append(Paragraph(p["sig"], ParagraphStyle("sig", fontName="BodyMed", fontSize=9.2,
                                                    leading=13, textColor=MUTED, spaceAfter=10)))
        f.extend(rule_line(space_before=0, space_after=10))
        f.append(Paragraph("Who this is", S["h3"]))
        f.append(Paragraph(p["who"], S["body"]))
        f.append(Paragraph("The trap", S["h3"]))
        f.append(Paragraph(p["trap"], S["body"]))
        f.append(Paragraph("The three moves", S["h3"]))
        f.extend(bullets(p["moves"]))
        f.append(Paragraph("What to ignore", S["h3"]))
        f.append(Paragraph(p["ignore"], S["body"]))
        f.append(Spacer(1, 6))
        f.append(callout("How you will know it worked", p["know"]))
        f.append(PageBreak())

    # ---------- 19-20. Roadmap ----------
    f.append(Paragraph("THE SEQUENCE", S["eyebrow"]))
    f.append(Paragraph("The 90-day method", S["h1"]))
    f.append(Paragraph(
        "Every pattern runs the same three-phase shape. What changes is the content of each "
        "phase, which your weakest dimension decides. Ninety days is deliberate: it is long "
        "enough to prove a cadence and short enough to survive one planning cycle.", S["body"]))
    f.append(Spacer(1, 8))
    # phase bar
    bar = Table([[Paragraph("MONTH 1 · STABILIZE", S["cellh"]),
                  Paragraph("MONTH 2 · BUILD", S["cellh"]),
                  Paragraph("MONTH 3 · COMPOUND", S["cellh"])]],
                colWidths=[W / 3.0] * 3, rowHeights=[0.34 * inch])
    bar.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), HexColor("#4f46e5")),
        ("BACKGROUND", (1, 0), (1, 0), HexColor("#6366f1")),
        ("BACKGROUND", (2, 0), (2, 0), HexColor("#818cf8")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ]))
    for i in range(3):
        bar._cellvalues[0][i].style = ParagraphStyle("bar", fontName="BodyBold", fontSize=8.6,
                                                     leading=11, textColor=WHITE, alignment=1)
    f.append(bar)
    f.append(Spacer(1, 14))
    for month, phase, obj, acts, metrics in ROADMAP[:2]:
        f.append(Paragraph(f"{month} — {phase}", S["h2"]))
        f.append(Paragraph(obj, ParagraphStyle("obj", parent=S["body"], textColor=INK, spaceAfter=5)))
        f.extend(bullets(acts))
        f.append(Paragraph(f"<b>Done looks like:</b> {metrics}", S["small"]))
    f.append(PageBreak())

    f.append(Paragraph("THE SEQUENCE", S["eyebrow"]))
    f.append(Paragraph("Month three, and what comes after", S["h1"]))
    month, phase, obj, acts, metrics = ROADMAP[2]
    f.append(Paragraph(f"{month} — {phase}", S["h2"]))
    f.append(Paragraph(obj, ParagraphStyle("obj2", parent=S["body"], textColor=INK, spaceAfter=5)))
    f.extend(bullets(acts))
    f.append(Paragraph(f"<b>Done looks like:</b> {metrics}", S["small"]))
    f.append(Spacer(1, 8))
    f.append(Paragraph("How the phases change by pattern", S["h2"]))
    rows = [["If your weakest dimension is", "Month 1 becomes"],
            ["Audience", "List consolidation and a single signup path everywhere"],
            ["Content", "One flagship format named, hosted, and scheduled"],
            ["Distribution", "A channel inventory and a concentration-risk number"],
            ["Operations", "A documented workflow and one named accountable owner"],
            ["Strategy", "A one-page publishing thesis approved by leadership"],
            ["Alignment", "A board narrative and a standing monthly audience review"]]
    f.append(data_table(rows, [2.1 * inch, W - 2.1 * inch]))
    f.append(Spacer(1, 12))
    f.append(callout(
        "Do not run two phases at once",
        "The most common way this method fails is compressing it. Month 2 depends on the "
        "baseline you recorded in month 1; without it, month 3 has no story to tell."))
    f.append(PageBreak())

    # ---------- 21. KPIs ----------
    f.append(Paragraph("MEASUREMENT", S["eyebrow"]))
    f.append(Paragraph("The numbers worth reporting", S["h1"]))
    f.append(Paragraph(
        "Report four numbers, monthly, unchanged for a year. The temptation is to add metrics "
        "as the operation matures; resist it. Belief is built by repetition, not coverage.",
        S["body"]))
    for tier, items in KPIS:
        f.append(Paragraph(tier, S["h3"]))
        rows = [["Metric", "What it is", "Target framing"]]
        for label, desc, target in items:
            rows.append([f"<b>{label}</b>", desc, target])
        f.append(data_table(rows, [1.65 * inch, W - 3.35 * inch, 1.7 * inch]))
        f.append(Spacer(1, 4))
    f.append(Spacer(1, 6))
    f.append(Paragraph(
        "Targets are framing, not promises. Set your own from the baseline you record in "
        "month 1 — a number moving in the right direction from a known start beats a "
        "benchmark borrowed from a company that is not yours.", S["small"]))
    f.append(PageBreak())

    # ---------- 22. Failure patterns ----------
    f.append(Paragraph("PITFALLS", S["eyebrow"]))
    f.append(Paragraph("Six ways this goes wrong", S["h1"]))
    f.append(Paragraph(
        "I have watched each of these happen at companies with more budget and better talent "
        "than the ones that got it right. The difference is almost never capability.", S["body"]))
    for title, desc, fix in FAILURES:
        f.append(KeepTogether([
            Paragraph(title, S["h3"]),
            Paragraph(desc, ParagraphStyle("fd", parent=S["body"], spaceAfter=3)),
            Paragraph(f"<b>The correction:</b> {fix}",
                      ParagraphStyle("ff", parent=S["small"], textColor=BODY, spaceAfter=2)),
        ]))
    f.append(NextPageTemplate("dark"))
    f.append(PageBreak())

    # ---------- 23. Next step ----------
    f.append(Spacer(1, 1.1 * inch))
    f.append(Paragraph("NEXT STEP", S["deyebrow"]))
    f.append(Paragraph("Get the scored<br/>version", S["dh1"]))
    f.append(Spacer(1, 4))
    f.append(Paragraph(
        "The worksheet in this guide is a hand-run approximation of a diagnostic that does "
        "the whole thing properly: seven sections, weighted scoring across all six "
        "dimensions, your pattern identified automatically, and a 90-day roadmap generated "
        "from your actual answers rather than a table.", S["dbody"]))
    f.append(Paragraph(
        "It takes about twelve minutes and it is free.", S["dbody"]))
    f.append(Spacer(1, 14))
    f.append(Paragraph(
        "<b>Take the Publisher Test</b><br/>"
        "<font color='#818cf8'>blueprint.jeffhallstead.com</font>",
        ParagraphStyle("cta", fontName="Body", fontSize=12.5, leading=19, textColor=WHITE)))
    f.append(Spacer(1, 22))
    f.extend(rule_line(color=Color(1, 1, 1, 0.14), space_before=0, space_after=14))
    f.append(Paragraph(
        "<b>About Jeff Hallstead</b>", ParagraphStyle("ab", fontName="BodyBold", fontSize=10,
                                                      leading=14, textColor=WHITE, spaceAfter=5)))
    f.append(Paragraph(
        "Fifteen years measuring audiences at Nielsen and Comscore, followed by audience and "
        "content roles across Warner Bros, Disney, Paramount, NBCUniversal and Amazon "
        "Studios — then building the same function inside brands standing it up for the "
        "first time. He works with a small number of brand and marketing leaders each year "
        "on exactly the sequence in this guide.", S["dbody"]))

    doc.build(f)


# =========================================================================
# MARKDOWN MANUSCRIPT
# =========================================================================
def build_markdown():
    L = []
    a = L.append
    a("# The Publisher Blueprint Guide")
    a("")
    a("*How to find out whether you own your audience — and the six moves that change the "
      "answer in 90 days.* By Jeff Hallstead.")
    a("")
    a("> Editable manuscript. The PDF is generated from `scripts/build-guide.py`; edit the "
      "CONTENT structures there and re-run to regenerate both files.")
    a("")
    a("## The six dimensions")
    a("")
    a("| Dimension | Weight | What it measures | The honest question |")
    a("| --- | --- | --- | --- |")
    for n, w, d, q in DIMENSIONS:
        a(f"| {n} | {w} | {d} | {q} |")
    a("")
    a("## The five maturity levels")
    a("")
    for lvl, title, rng, summary, chars, focus in LEVELS:
        a(f"### Level {lvl} — {title} ({rng})")
        a("")
        a(summary)
        a("")
        for c in chars:
            a(f"- {c}")
        a("")
        a(f"**Strategic focus:** {focus}")
        a("")
    a("## The eight patterns")
    a("")
    for p in PERSONAS:
        a(f"### {p['n']} — {p['name']}")
        a("")
        a(f"*{p['sig']}*")
        a("")
        a(f"**Who this is.** {p['who']}")
        a("")
        a(f"**The trap.** {p['trap']}")
        a("")
        a("**The three moves.**")
        for m in p["moves"]:
            a(f"- {m}")
        a("")
        a(f"**What to ignore.** {p['ignore']}")
        a("")
        a(f"**How you will know it worked.** {p['know']}")
        a("")
    a("## The 90-day method")
    a("")
    for month, phase, obj, acts, metrics in ROADMAP:
        a(f"### {month} — {phase}")
        a("")
        a(obj)
        a("")
        for x in acts:
            a(f"- {x}")
        a("")
        a(f"**Done looks like:** {metrics}")
        a("")
    a("## The numbers worth reporting")
    a("")
    for tier, items in KPIS:
        a(f"### {tier}")
        a("")
        a("| Metric | What it is | Target framing |")
        a("| --- | --- | --- |")
        for label, desc, target in items:
            a(f"| {label} | {desc} | {target} |")
        a("")
    a("## Six ways this goes wrong")
    a("")
    for title, desc, fix in FAILURES:
        a(f"### {title}")
        a("")
        a(desc)
        a("")
        a(f"**The correction:** {fix}")
        a("")
    with open(OUT_MD, "w") as fh:
        fh.write("\n".join(L) + "\n")


if __name__ == "__main__":
    ensure_fonts()
    S = styles()
    globals()["S"] = S
    os.makedirs("/mnt/documents", exist_ok=True)
    build_pdf()
    build_markdown()
    print(f"wrote {OUT_PDF}")
    print(f"wrote {OUT_MD}")
