# /// script
# requires-python = ">=3.11"
# dependencies = ["matplotlib==3.11.2"]
# ///
"""Regenerate the comparison tables and GitHub chart assets from reviewed data.

Run from the repository root: uv run legacy/scripts/generate_charts.py
The first table in COMPARISON.md and quality-review/scores.json are the inputs.
"""

from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
import json
import re

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.colors import Normalize
from matplotlib.lines import Line2D
from matplotlib.ticker import NullLocator


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "charts"
BACKGROUND = "#f6f8fb"
INK = "#172b45"
MUTED = "#53647a"
GRID = "#dce3eb"
COST = "#15846d"
TIME = "#c67b12"
QUALITY = "#4268b3"
WEIGHTS = {"cost": 100 / 3, "time": 100 / 3, "quality": 100 / 3}
COP_PER_USD = 3341.23
NAMES = {
    "deepseek-cloud-deepseek-flash": "DeepSeek Flash · cloud",
    "zai-cloud-glm-5.3-flash": "GLM Flash · cloud",
    "anthropic-cloud-sonnet-5.5-medium": "Sonnet 5.5",
    "anthropic-cloud-opus-5.5-medium": "Opus 5.5",
    "anthropic-cloud-fable-5.1-high": "Fable 5.1",
    "openai-cloud-gpt-6-astra-high": "GPT-6 Astra",
    "openai-cloud-gpt-6-sol-medium": "GPT-6 Sol",
    "openai-cloud-gpt-5.6-sol-medium": "GPT-5.6 Sol",
    "xai-cloud-grok-4.7-fast-500k-medium": "Grok 4.7 Fast",
    "4x-rtxpro6000-deepseek-v4-flash-q8kxl": "DeepSeek V4 · GPU",
    "4x-rtxpro6000-glm-5.3-flash-q4kxl": "GLM Flash · GPU",
}


def rounded(value):
    return str(Decimal(str(value)).quantize(Decimal(".01"), rounding=ROUND_HALF_UP))


def load_data():
    scores = {
        row["folder"]: row
        for row in json.loads((ROOT / "quality-review" / "scores.json").read_text())
    }
    data = []
    overview = (ROOT / "COMPARISON.md").read_text().split("## ", 1)[0]
    for line in overview.splitlines():
        if not line.startswith("| ") or not re.search(r"\bCOP [\d,.]+", line):
            continue
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        folder = cells[6].strip("`")
        quality = scores[folder]["computed_overall"] / 20
        seconds = sum(
            int(number) * {"h": 3600, "min": 60, "s": 1}[unit]
            for number, unit in re.findall(r"(\d+)\s*(h|min|s)\b", cells[3])
        )
        cost_cop = float(re.search(r"COP ([\d,.]+)", cells[5])[1].replace(",", ""))
        data.append({
            "folder": folder,
            "model": cells[0],
            "label": NAMES.get(folder, cells[0]),
            "where": cells[1],
            "cost_cop": cost_cop,
            "cost_usd_unrounded": cost_cop / COP_PER_USD,
            "cost_usd_display": re.search(r"\*\*\$([\d,.]+)\*\*", cells[5])[1],
            "cost_display": cells[5],
            "seconds": seconds,
            "time_display": cells[3],
            "quality": quality,
            "spec": scores[folder]["scores"]["spec"],
            "eligible": scores[folder]["scores"]["spec"] >= 4,
        })
    assert len(data) == 15 and len({row["folder"] for row in data}) == 15
    eligible = [row for row in data if row["eligible"]]
    min_cost = min(row["cost_cop"] for row in eligible)
    min_seconds = min(row["seconds"] for row in eligible)
    for row in eligible:
        row["contributions"] = {
            "cost": WEIGHTS["cost"] * min_cost / row["cost_cop"],
            "time": WEIGHTS["time"] * min_seconds / row["seconds"],
            "quality": WEIGHTS["quality"] * row["quality"] / 5,
        }
        row["weighted_score"] = sum(row["contributions"].values())
    return data, eligible, min_cost, min_seconds


def direct_rankings(data):
    return {
        "cost": sorted(data, key=lambda row: (row["cost_cop"], row["seconds"], -row["quality"]))[:5],
        "time": sorted(data, key=lambda row: (row["seconds"], row["cost_cop"], -row["quality"]))[:5],
        "quality": sorted(data, key=lambda row: (-row["quality"], row["cost_cop"], row["seconds"]))[:5],
    }


def write_tables(rankings):
    start = "<!-- BEGIN GENERATED PRIORITY TABLES -->"
    end = "<!-- END GENERATED PRIORITY TABLES -->"
    section = [
        start,
        "",
        "## Top 5 by primary driver",
        "",
        "These three tables rank directly by the named metric, separately from the equal-weight top five above. "
        "They use the same 11 eligible applications (business rules/spec grade at least 4/5). "
        "Cost and time sort ascending; quality sorts descending using unrounded grades. "
        "Ties favor lower cost, then shorter time; cost ties favor shorter time, then higher quality. "
        "The chart versions are embedded in [README.md](README.md).",
    ]
    for driver, title in [
        ("cost", "Cost driver — lowest cost"),
        ("time", "Time driver — shortest run"),
        ("quality", "Quality driver — highest artifact grade"),
    ]:
        section += ["", "### " + title, "", "| Rank | Model | Cost (USD / COP) | Time | Quality /5 |", "|---:|---|---:|---|---:|"]
        for rank, row in enumerate(rankings[driver], 1):
            section.append(
                f"| {rank} | [{row['label']}](quality-review/{row['folder']}.md) | "
                f"{row['cost_display']} | {row['time_display']} | {rounded(row['quality'])} |"
            )
    section += ["", end]
    path = ROOT / "COMPARISON.md"
    original = path.read_text()
    generated = "\n".join(section)
    if start in original:
        assert end in original
        before, remaining = original.split(start, 1)
        _, after = remaining.split(end, 1)
        updated = before + generated + after
    else:
        updated = original.rstrip() + "\n\n" + generated + "\n"
    path.write_text(updated)


def style_axis(axis, grid="x"):
    axis.set_facecolor("white")
    axis.spines[["top", "right", "left", "bottom"]].set_visible(False)
    axis.tick_params(length=0, colors=MUTED, pad=8)
    axis.set_axisbelow(True)
    axis.grid(axis=grid, color=GRID, linewidth=0.8)


def heading(fig, title, subtitle):
    fig.text(0.055, 0.945, title, fontsize=23, weight="bold", color=INK)
    fig.text(0.055, 0.899, subtitle, fontsize=11.5, color=MUTED)


def footer(fig, text):
    fig.text(0.055, 0.035, text, fontsize=9.5, color=MUTED)


def save(fig, name):
    for extension in ("png", "svg"):
        fig.savefig(OUTPUT / f"{name}.{extension}", dpi=160, facecolor=BACKGROUND)
    plt.close(fig)


def chart_top_five(rankings):
    fig, axes = plt.subplots(1, 3, figsize=(16, 9.4))
    fig.patch.set_facecolor(BACKGROUND)
    fig.subplots_adjust(left=0.055, right=0.965, bottom=0.11, top=0.79, wspace=0.18)
    heading(fig, "Different priorities, different winners", "Direct rankings · 11 eligible applications · Quality is the reviewed artifact grade, out of five")
    settings = [
        ("cost", "LOWEST COST", COST, 3.3, "Run cost (USD; COP shown below each price)"),
        ("time", "SHORTEST TIME", TIME, 52, "Elapsed time (minutes)"),
        ("quality", "HIGHEST QUALITY", QUALITY, 5.35, "Artifact quality /5"),
    ]
    for axis, (driver, title, color, limit, xlabel) in zip(axes, settings):
        style_axis(axis)
        axis.set_title(title, loc="left", fontsize=12, weight="bold", color=color, pad=25)
        for index, row in enumerate(rankings[driver]):
            value = {"cost": row["cost_usd_unrounded"], "time": row["seconds"] / 60, "quality": row["quality"]}[driver]
            y = 4 - index
            axis.barh(y, value, height=0.34, color=color, alpha=1 if index == 0 else 0.68)
            axis.text(0, y + 0.30, f"{index + 1:02d}  {row['label']}", fontsize=12, weight="bold", color=INK)
            display = {"cost": f"${row['cost_usd_display']}", "time": f"{row['seconds']//60}m {row['seconds']%60:02d}s", "quality": rounded(row["quality"])}[driver]
            axis.text(value + limit * 0.025, y, display, va="center", fontsize=11, color=INK, weight="bold")
            if driver == "cost":
                axis.text(value + limit * 0.025, y - 0.22, f"COP {row['cost_cop']:,.0f}", va="center", fontsize=9, color=MUTED)
        axis.set(xlim=(0, limit), ylim=(-0.42, 4.65), yticks=[], xlabel=xlabel)
        if driver == "cost":
            axis.set_xticks([0, 1, 2, 3], labels=["$0", "$1", "$2", "$3"])
            for label in axis.get_xticklabels():
                label.set_fontweight("bold")
        elif driver == "time":
            axis.set_xticks([0, 10, 20, 30, 40, 50])
        else:
            axis.set_xticks([0, 1, 2, 3, 4, 5])
    footer(fig, "Eligibility: business rules/spec ≥4/5. Astra and Fable are effectively tied in quality. Source: COMPARISON.md + quality-review/scores.json · 2026-10-01")
    save(fig, "top-five-by-priority")


def chart_tradeoffs(data):
    fig, axis = plt.subplots(figsize=(14, 8.5))
    fig.patch.set_facecolor(BACKGROUND)
    fig.subplots_adjust(left=0.085, right=0.89, bottom=0.15, top=0.80)
    heading(fig, "Cost and turnaround, with quality in view", "Lower and farther left means faster and cheaper · Color shows quality · Cost uses a logarithmic scale")
    style_axis(axis, "both")
    norm = Normalize(3, 5)
    cmap = plt.get_cmap("viridis")
    offsets = {
        "DeepSeek Flash · cloud": (12, -20), "GLM Flash · cloud": (12, 10),
        "Sonnet 5.5": (12, 12), "Opus 5.5": (12, -18),
        "GPT-6 Sol": (12, -18), "GPT-5.6 Sol": (-12, 17),
        "GPT-6 Astra": (12, 15), "Fable 5.1": (-12, -18),
        "Grok 4.7 Fast": (12, -19), "GLM Flash · GPU": (-12, 13),
        "DeepSeek V4 · GPU": (-12, -22),
    }
    for row in data:
        gpu = "GPU" in row["where"]
        axis.scatter(row["cost_usd_unrounded"], row["seconds"] / 60, s=125, color=cmap(norm(row["quality"])), marker="D" if gpu else "o", edgecolor="white", linewidth=1.5, zorder=4)
        dx, dy = offsets[row["label"]]
        axis.annotate(row["label"], (row["cost_usd_unrounded"], row["seconds"] / 60), xytext=(dx, dy), textcoords="offset points", ha="left" if dx > 0 else "right", fontsize=11, color=INK, arrowprops={"arrowstyle": "-", "color": "#aebac8", "lw": 0.7}, zorder=5)
    axis.set(xscale="log", xlim=(1000 / COP_PER_USD, 240000 / COP_PER_USD), ylim=(0, 108), xlabel="Recorded run cost (USD, logarithmic scale)", ylabel="Elapsed time (minutes)")
    axis.set_xticks([0.5, 1, 3, 10, 30, 60], labels=["$0.50", "$1", "$3", "$10", "$30", "$60"])
    for label in axis.get_xticklabels():
        label.set_fontweight("bold")
    axis.xaxis.set_minor_locator(NullLocator())
    cop_axis = axis.secondary_xaxis("top", functions=(lambda usd: usd * COP_PER_USD, lambda cop: cop / COP_PER_USD))
    cop_axis.set_xticks([1500, 3000, 10000, 30000, 100000, 200000], labels=["1,500", "3,000", "10,000", "30,000", "100,000", "200,000"])
    cop_axis.set_xlabel("COP equivalent (secondary)", fontsize=9, color=MUTED)
    cop_axis.tick_params(length=0, labelsize=9, colors=MUTED, pad=7)
    cop_axis.xaxis.set_minor_locator(NullLocator())
    cop_axis.spines["top"].set_visible(False)
    axis.set_yticks([0, 20, 40, 60, 80, 100])
    legend = [Line2D([0], [0], marker=marker, color="none", markerfacecolor=MUTED, markeredgecolor="white", markersize=9, label=label) for marker, label in [("o", "Cloud"), ("D", "Rented GPU")]]
    axis.legend(handles=legend, loc="upper left", frameon=False, fontsize=10)
    color_axis = fig.add_axes([0.915, 0.25, 0.017, 0.42])
    colorbar = fig.colorbar(plt.cm.ScalarMappable(norm=norm, cmap=cmap), cax=color_axis)
    colorbar.set_label("Quality /5", color=INK)
    colorbar.outline.set_visible(False)
    footer(fig, "11 eligible apps (spec ≥4/5). Cloud costs and GPU rental costs differ in basis; cloud runs also received T7 QA. Source: repository benchmark and review records.")
    save(fig, "cost-time-quality")


def chart_weighted(data):
    rows = sorted(data, key=lambda row: row["weighted_score"], reverse=True)[:5]
    fig, axis = plt.subplots(figsize=(14, 7.8))
    fig.patch.set_facecolor(BACKGROUND)
    fig.subplots_adjust(left=0.27, right=0.94, bottom=0.14, top=0.73)
    heading(fig, "Cost vs Time vs Quality", "Equal weights: 33% cost · 33% time · 33% quality · Each colored segment is its contribution to the total")
    style_axis(axis)
    for index, row in enumerate(rows):
        y = len(rows) - index - 1
        left = 0
        for metric, color in [("cost", COST), ("time", TIME), ("quality", QUALITY)]:
            value = row["contributions"][metric]
            axis.barh(y, value, left=left, color=color, height=0.49)
            if value >= 6:
                axis.text(left + value / 2, y, f"{value:.1f}", ha="center", va="center", fontsize=11, color="white", weight="bold")
            left += value
        axis.text(left + 1.2, y, rounded(row["weighted_score"]), va="center", fontsize=12, weight="bold", color=INK)
    axis.set_yticks(list(range(4, -1, -1)), labels=[f"{i + 1}. {row['label']}" for i, row in enumerate(rows)])
    axis.set(xlim=(0, 100), ylim=(-0.65, 4.65), xlabel="Equal-weight decision score /100 (higher is better)")
    legend = axis.legend(handles=[Line2D([0], [0], color=color, lw=9, label=label) for label, color in [("Cost · cheaper earns more, up to 33.3", COST), ("Time · faster earns more, up to 33.3", TIME), ("Quality · higher grade earns more, up to 33.3", QUALITY)]], title="More is better: longer bars and higher scores rank higher", loc="upper left", bbox_to_anchor=(0.048, 0.875), bbox_transform=fig.transFigure, ncol=3, frameon=False, fontsize=10, alignment="left")
    legend.get_title().set(fontsize=11.5, weight="bold", color=INK)
    footer(fig, "Score = 33.3 × (minimum cost / run cost) + 33.3 × (425 / seconds) + 33.3 × (quality / 5). Uses unrounded cost ratios; quality grades remain unchanged.")
    save(fig, "weighted-value")


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 11, "axes.labelcolor": INK, "axes.labelsize": 11, "svg.fonttype": "none"})
    all_rows, eligible, min_cost, min_seconds = load_data()
    rankings = direct_rankings(eligible)
    chart_top_five(rankings)
    chart_tradeoffs(eligible)
    chart_weighted(eligible)
    (OUTPUT / "chart-data.json").write_text(json.dumps({
        "review_date": "2026-10-01",
        "sources": ["COMPARISON.md", "quality-review/scores.json"],
        "eligibility_min_spec_grade": 4,
        "weights": WEIGHTS,
        "exchange_rate_cop_per_usd": COP_PER_USD,
        "minimum_eligible_cost_cop": min_cost,
        "minimum_eligible_cost_usd_unrounded": min_cost / COP_PER_USD,
        "minimum_eligible_seconds": min_seconds,
        "top_five": {driver: [row["folder"] for row in rows] for driver, rows in rankings.items()},
        "applications": all_rows,
    }, indent=2) + "\n")
    write_tables(rankings)
    print(f"Generated three PNG/SVG charts and three tables from {len(eligible)} eligible applications.")


if __name__ == "__main__":
    main()
