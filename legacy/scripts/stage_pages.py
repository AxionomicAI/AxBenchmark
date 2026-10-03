"""Stage the archived demos and current specs for the manual Pages workflow."""
from pathlib import Path
import argparse
import shutil
import os
import re
from urllib.parse import urlsplit, urlunsplit, unquote, quote

ROOT = Path(__file__).resolve().parents[2]

def alias_docs(output: Path, canonical: Path, alias: Path) -> None:
    files = [alias] if alias.is_file() else list(alias.rglob("*.md"))
    for target in files:
        if target.suffix != ".md":
            continue
        source = canonical if alias.is_file() else canonical / target.relative_to(alias)
        def link(match):
            url = urlsplit(match[2])
            if url.scheme or url.netloc or not url.path or url.path.startswith("/"):
                return match[0]
            resolved = (source.parent / unquote(url.path)).resolve()
            if not resolved.is_relative_to(output) or not resolved.exists():
                return match[0]
            path = quote(os.path.relpath(resolved, target.parent), safe="/._-~")
            return match[1] + urlunsplit(("", "", path, url.query, url.fragment)) + match[3]
        text = re.sub(r"(\[[^\]\n]*\]\()([^\n)]*)(\))", link, target.read_text())
        target.write_text(text)


def stage(output: Path) -> None:
    output = output.resolve()
    for source in (ROOT / "legacy", ROOT / "spec"):
        if output == source or source in output.parents or output in source.parents:
            raise ValueError("Output must not overlap repository source directories")
    output.mkdir(parents=True, exist_ok=False)
    ignore = shutil.ignore_patterns(".git", ".DS_Store", "__pycache__")
    for name in ("legacy", "spec"):
        shutil.copytree(ROOT / name, output / name, ignore=ignore)
    # Keep published first-edition demo/evidence URLs working.
    runs = sorted(p for p in (ROOT / "legacy/runs").iterdir() if p.is_dir())
    for run in runs:
        shutil.copytree(run, output / run.name, ignore=ignore)
        alias_docs(output, output / "legacy/runs" / run.name, output / run.name)
    for name in ("assets", "benchmark", "quality-review", "scripts"):
        shutil.copytree(ROOT / "legacy" / name, output / name, ignore=ignore)
        alias_docs(output, output / "legacy" / name, output / name)
    shutil.copytree(ROOT / "legacy/tools/glm-harness", output / "glm-harness", ignore=ignore)
    alias_docs(output, output / "legacy/tools/glm-harness", output / "glm-harness")
    for name in ("README.md", "COMPARISON.md", "QUALITY_COMPARISON.md"):
        shutil.copy2(ROOT / "legacy" / name, output / name)
        alias_docs(output, output / "legacy" / name, output / name)
    shutil.copy2(ROOT / "LICENSE", output / "LICENSE")
    shutil.copytree(ROOT / "spec/implementation/reference/design", output / "spec/design", ignore=ignore)
    alias_docs(output, output / "spec/implementation/reference/design", output / "spec/design")
    (output / ".nojekyll").touch()
    print(f"Staged {len(runs)} legacy runs and spec references in {output}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path, help="New output directory; existing directories are refused")
    stage(parser.parse_args().output)
