#!/bin/bash
# run-benchmark.sh WORKDIR [--qa] -- AGENT COMMAND...
#
# Runs the inventory-website benchmark against any headless coding agent: one task at a time, each in a
# brand-new agent process (fresh context), in WORKDIR. The task prompt (tasks/00-project.md + the task file)
# is appended as the command's last argument. The files in WORKDIR are the only state carried between tasks.
#   --qa   also run T7 (test in a real browser and fix) after T1-T6
#
# Timing and output go to WORKDIR.bench/ (outside the repo, so the agent never sees them):
#   tasks.jsonl (task, exit code, start, end), <task>.out / <task>.err, <task>.tgz snapshot of WORKDIR.
#
# Examples (headless, no sandbox, as in the comparison):
#   ./run-benchmark.sh ~/bench/sonnet --qa -- claude -p --model claude-sonnet-5-5 --effort medium --dangerously-skip-permissions --output-format stream-json --verbose
#   ./run-benchmark.sh ~/bench/gpt6   --qa -- codex exec -m gpt-6-sol -c model_reasoning_effort=medium --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check --ephemeral --json
#   ./run-benchmark.sh ~/bench/local       -- pi --no-session --mode json --model local/my-model
#
# Each task gets at most TASK_TIMEOUT seconds (default 10800 = 3 h). Rules for the operator: only prompt and
# verify. Never edit the agent's files, never add hints to the prompts.
set -u
HERE=$(cd "$(dirname "$0")" && pwd); TASKS=$HERE/tasks
WORK=${1:?usage: run-benchmark.sh WORKDIR [--qa] -- AGENT COMMAND...}; shift
QA=0; [ "${1:-}" = --qa ] && { QA=1; shift; }
[ "${1:-}" = -- ] && shift
[ $# -gt 0 ] || { echo "missing agent command after --"; exit 2; }
command -v "$1" >/dev/null || { echo "agent command not found: $1"; exit 2; }
TIMEOUT=$(command -v timeout || command -v gtimeout || true)

mkdir -p "$WORK"; WORK=$(cd "$WORK" && pwd); LOG=$WORK.bench; mkdir -p "$LOG"
log() { echo "$(date +%H:%M:%S) $*" | tee -a "$LOG/run.log"; }
SPECS=("$TASKS"/T[1-6]-*.md); [ $QA = 1 ] && SPECS+=("$TASKS"/T7-*.md)

log "===== benchmark in $WORK: $*"
for SPEC in "${SPECS[@]}"; do
  T=$(basename "$SPEC" .md)
  PROMPT="$(cat "$TASKS/00-project.md")

$(cat "$SPEC")"
  log "== $T start"; START=$(date +%s)
  ( cd "$WORK" && ${TIMEOUT:+$TIMEOUT ${TASK_TIMEOUT:-10800}} "$@" "$PROMPT" < /dev/null ) > "$LOG/$T.out" 2> "$LOG/$T.err"
  RC=$?; END=$(date +%s)
  echo "{\"task\":\"$T\",\"rc\":$RC,\"start\":$START,\"end\":$END}" >> "$LOG/tasks.jsonl"
  tar czf "$LOG/$T.tgz" -C "$WORK" .
  log "== $T end rc=$RC in $(( END - START ))s; commits: $(git -C "$WORK" log --oneline 2>/dev/null | wc -l | tr -d ' ')"
done
log "ALL_DONE"
