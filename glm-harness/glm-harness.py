#!/usr/bin/env python3
"""Minimal coding-agent harness: one conversation, T1-T6 in order, against an OpenAI-compatible server.

usage: glm-harness.py WORKDIR [--model NAME] [--url URL] [--max-tokens N]

Each task is sent as a new user message (tasks/00-project.md + the task file) into the SAME conversation,
so the context carries across tasks. The agent gets four tools (bash, read_file, write_file, edit_file),
all confined to WORKDIR. A task ends when the model answers without calling a tool, or on the step/time limit.
Logs go to WORKDIR.bench/: run.log, tasks.jsonl, <task>.jsonl (every request/response), <task>.tgz snapshot.
"""
import argparse, json, os, subprocess, sys, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser()
ap.add_argument("workdir")
ap.add_argument("--model", default="glm-5.3-flash")
ap.add_argument("--url", default="http://127.0.0.1:18000/v1/chat/completions")
ap.add_argument("--max-tokens", type=int, default=65536)
ap.add_argument("--max-steps", type=int, default=150)
ap.add_argument("--task-timeout", type=int, default=10800)
args = ap.parse_args()

WORK = os.path.abspath(args.workdir); os.makedirs(WORK, exist_ok=True)
LOG = WORK + ".bench"; os.makedirs(LOG, exist_ok=True)
ENV = dict(os.environ, GIT_AUTHOR_NAME="bench-agent", GIT_AUTHOR_EMAIL="bench@localhost",
           GIT_COMMITTER_NAME="bench-agent", GIT_COMMITTER_EMAIL="bench@localhost")

def log(msg):
    line = time.strftime("%H:%M:%S ") + msg
    print(line, flush=True)
    open(f"{LOG}/run.log", "a").write(line + "\n")

def inside(p):
    p = os.path.abspath(os.path.join(WORK, p))
    if not (p == WORK or p.startswith(WORK + os.sep)):
        raise ValueError(f"path outside the work directory: {p}")
    return p

def clip(s, n=30000):
    return s if len(s) <= n else s[:n] + f"\n... [truncated {len(s) - n} chars]"

def t_bash(command, timeout=600):
    r = subprocess.run(command, shell=True, cwd=WORK, env=ENV, capture_output=True, text=True, timeout=timeout)
    return clip(f"exit code {r.returncode}\n--- stdout\n{r.stdout}\n--- stderr\n{r.stderr}")

def t_read(path):
    return clip(open(inside(path)).read())

def t_write(path, content):
    p = inside(path); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "w").write(content)
    return f"wrote {len(content)} chars to {path}"

def t_edit(path, old, new):
    p = inside(path); s = open(p).read(); n = s.count(old)
    if n != 1:
        return f"error: old text found {n} times in {path}; it must match exactly once"
    open(p, "w").write(s.replace(old, new, 1))
    return f"edited {path}"

TOOLS = {"bash": t_bash, "read_file": t_read, "write_file": t_write, "edit_file": t_edit}
def fn(name, desc, props, req):
    return {"type": "function", "function": {"name": name, "description": desc,
            "parameters": {"type": "object", "properties": props, "required": req}}}
S = {"type": "string"}
SPECS = [
    fn("bash", "Run a shell command in the project directory and return its output.", {"command": S}, ["command"]),
    fn("read_file", "Read a file (path relative to the project directory).", {"path": S}, ["path"]),
    fn("write_file", "Create or overwrite a file with the given content.", {"path": S, "content": S}, ["path", "content"]),
    fn("edit_file", "Replace one exact occurrence of old with new in a file.", {"path": S, "old": S, "new": S}, ["path", "old", "new"]),
]

SYSTEM = (f"You are a coding agent. You work in the directory {WORK} on a Linux machine, using the tools provided. "
          "Do the user's task completely, then reply with a short summary and no tool call.")

def chat(messages):
    body = json.dumps({"model": args.model, "messages": messages, "tools": SPECS,
                       "max_tokens": args.max_tokens}).encode()
    req = urllib.request.Request(args.url, body, {"Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req, timeout=7200))

messages = [{"role": "system", "content": SYSTEM}]
project = open(f"{HERE}/tasks/00-project.md").read()
specs = sorted(f for f in os.listdir(f"{HERE}/tasks") if f[:2] in ("T1", "T2", "T3", "T4", "T5", "T6"))
log(f"===== same-context harness in {WORK}: model {args.model}, max_tokens {args.max_tokens}")

for spec in specs:
    task = spec[:-3]
    messages.append({"role": "user", "content": project + "\n\n" + open(f"{HERE}/tasks/{spec}").read()})
    log(f"== {task} start"); start = time.time(); steps = 0; out_tok = 0; status = "done"
    tlog = open(f"{LOG}/{task}.jsonl", "w")
    while True:
        if steps >= args.max_steps: status = "step limit"; break
        if time.time() - start > args.task_timeout: status = "timeout"; break
        try:
            r = chat(messages)
        except Exception as e:
            status = f"request error: {e}"; break
        steps += 1
        msg = r["choices"][0]["message"]; usage = r.get("usage", {})
        out_tok += usage.get("completion_tokens", 0)
        tlog.write(json.dumps({"step": steps, "usage": usage, "timings": r.get("timings"),
                               "finish_reason": r["choices"][0].get("finish_reason"), "message": msg}) + "\n"); tlog.flush()
        keep = {"role": "assistant", "content": msg.get("content") or ""}
        if msg.get("reasoning_content"): keep["reasoning_content"] = msg["reasoning_content"]
        calls = msg.get("tool_calls") or []
        if calls: keep["tool_calls"] = calls
        messages.append(keep)
        if not calls:
            break
        for c in calls:
            name = c["function"]["name"]
            try:
                a = json.loads(c["function"]["arguments"] or "{}")
                result = TOOLS[name](**a) if name in TOOLS else f"error: unknown tool {name}"
            except Exception as e:
                result = f"error: {type(e).__name__}: {e}"
            messages.append({"role": "tool", "tool_call_id": c.get("id", ""), "content": result})
            tlog.write(json.dumps({"step": steps, "tool": name, "result": result[:2000]}) + "\n")
    end = time.time()
    subprocess.run(["tar", "czf", f"{LOG}/{task}.tgz", "-C", WORK, "."])
    commits = subprocess.run("git log --oneline 2>/dev/null | wc -l", shell=True, cwd=WORK,
                             capture_output=True, text=True).stdout.strip()
    open(f"{LOG}/tasks.jsonl", "a").write(json.dumps({"task": task, "status": status, "steps": steps,
        "output_tokens": out_tok, "start": int(start), "end": int(end)}) + "\n")
    log(f"== {task} end {status} in {int(end - start)}s, {steps} steps, {out_tok} output tokens; commits: {commits}")
log("ALL_DONE")
