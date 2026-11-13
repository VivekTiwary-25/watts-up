# Commits a worker clone's changes in small logical steps (Codex sandbox can't write .git).
# Plan file: one commit per line:  <conventional message> | <path> <path> ...
# Usage: .\coord\commit-plan.ps1 -Clone D:\projects\vs-wt\t02-core-logic -Plan coord\results\T02.commits -Worker "Codex Sol"
param([string]$Clone, [string]$Plan, [string]$Worker)
$trailer = "Worker: $Worker`nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`nClaude-Session: https://claude.ai/code/session_01CcKic3FgUQPbG84nwVJSKp"
foreach ($line in [IO.File]::ReadAllLines((Resolve-Path $Plan))) {
  if ($line -notmatch '\|') { continue }
  $msg, $paths = $line -split '\|', 2
  $list = $paths.Trim() -split '\s+' | Where-Object { $_ }
  foreach ($p in $list) { cmd /c "git -C `"$Clone`" add -A -- `"$p`" 2>nul" }
  git -C $Clone diff --cached --quiet
  if ($LASTEXITCODE -ne 0) { git -C $Clone commit -q -m $msg.Trim() -m $trailer; "committed: $($msg.Trim())" } else { "skipped (no changes): $($msg.Trim())" }
}
git -C $Clone status --short
