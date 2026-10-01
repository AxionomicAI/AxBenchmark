#!/usr/bin/env python3
# Live, read-only feed of the same-context harness: follows run.log and the newest task log.
import glob, json, os, sys, time
B = sys.argv[1] if len(sys.argv) > 1 else "/workspace/bench/runs/glm-ctx.bench"
C = dict(dim="\033[2m", b="\033[1m", g="\033[32m", y="\033[33m", c="\033[36m", r="\033[31m", m="\033[35m", x="\033[0m")
def p(s): print(s + C["x"], flush=True)
seen = {}; runlog_pos = 0
while True:
    rl = os.path.join(B, "run.log")
    if os.path.exists(rl):
        with open(rl) as f:
            f.seek(runlog_pos)
            for line in f: p(C["b"] + C["y"] + "■ " + line.rstrip())
            runlog_pos = f.tell()
    for path in sorted(glob.glob(os.path.join(B, "T*.jsonl")), key=os.path.getmtime):
        pos = seen.get(path, 0)
        with open(path) as f:
            f.seek(pos)
            for line in f:
                if not line.endswith("\n"): break
                pos += len(line)
                try: d = json.loads(line)
                except Exception: continue
                if "tool" in d:
                    res = d["result"].replace("\n", " ⏎ ")
                    col = C["r"] if res.startswith("error") or "exit code 0" not in res[:12] and d["tool"] == "bash" else C["dim"]
                    p(f"{col}    ↳ {res[:220]}")
                else:
                    m = d["message"]; u = d.get("usage", {})
                    think = (m.get("reasoning_content") or "").strip().replace("\n", " ")
                    p(f"{C['c']}[{os.path.basename(path)[:-6]} step {d['step']}] {C['dim']}out {u.get('completion_tokens')} tok · ctx {u.get('prompt_tokens')} tok · {d.get('finish_reason')}")
                    if think: p(f"{C['m']}  💭 {think[:300]}{'…' if len(think) > 300 else ''}")
                    if (m.get("content") or "").strip(): p(f"{C['g']}  💬 {m['content'].strip()[:400].replace(chr(10), ' ')}")
                    for c in m.get("tool_calls") or []:
                        a = c["function"]["arguments"]
                        try:
                            j = json.loads(a); a = j.get("command") or j.get("path", "") + (f"  ({len(j['content'])} chars)" if "content" in j else "")
                        except Exception: pass
                        p(f"{C['b']}  🔧 {c['function']['name']}: {C['x']}{str(a)[:250]}")
        seen[path] = pos
    time.sleep(1)
