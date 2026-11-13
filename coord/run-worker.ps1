# Usage: .\coord\run-worker.ps1 -Worker vachana|sol|luna|grok -Task T01-scaffold -Branch t01-scaffold [-NoJunction]
param([string]$Worker, [string]$Task, [string]$Branch, [switch]$NoJunction)
$ErrorActionPreference = 'Continue'
$repo = 'D:\projects\vibe_sprint'
$wt = "D:\projects\vs-wt\$Branch"
$log = "$repo\coord\logs\$Task-$Worker.log"
if (-not (Test-Path $wt)) {
  git -C $repo worktree add -b $Branch $wt main 2>&1 | Out-Null
}
# share node_modules from main checkout (no new deps rule)
if (-not $NoJunction -and (Test-Path "$repo\node_modules") -and -not (Test-Path "$wt\node_modules")) {
  cmd /c mklink /J "$wt\node_modules" "$repo\node_modules" | Out-Null
}
Copy-Item "$repo\coord\tasks\$Task.md" "$wt\coord\tasks\$Task.md" -Force -ErrorAction SilentlyContinue
Copy-Item "$repo\coord\CONTRACT.md" "$wt\coord\CONTRACT.md" -Force -ErrorAction SilentlyContinue
$prompt = "You are a worker on a hackathon repo. Read AGENTS.md, coord/CONTRACT.md and coord/tasks/$Task.md, then do exactly that task in this directory (your own git worktree, branch $Branch). Commit small real steps as you go. Do not push or merge. When done write coord/results/$Task.md, commit it, and exit."
Set-Location $wt
"=== $(Get-Date -Format s) START $Worker $Task in $wt" | Out-File $log -Encoding utf8
switch ($Worker) {
  'vachana' {
    $env:CLAUDE_CONFIG_DIR = "$env:USERPROFILE\.claude-vachana"
    $allow = @('Read','Edit','Write','Glob','Grep','Skill',
      'Bash(npm *)','Bash(npx *)','Bash(git *)','Bash(node *)','Bash(mkdir *)','Bash(cp *)','Bash(mv *)','Bash(ls *)','Bash(cat *)','Bash(rm -rf ./*)',
      'PowerShell(npm *)','PowerShell(npx *)','PowerShell(git *)','PowerShell(node *)','PowerShell(New-Item *)','PowerShell(Copy-Item *)','PowerShell(Move-Item *)','PowerShell(Get-ChildItem *)')
    claude -p $prompt --output-format json --model opus --permission-mode acceptEdits --allowedTools $allow --add-dir "$repo\.git" *>> $log
    Remove-Item Env:\CLAUDE_CONFIG_DIR
  }
  'sol'  { codex exec -m gpt-6.1-sol -s workspace-write -c sandbox_workspace_write.network_access=true --add-dir "$repo\.git" -C $wt $prompt *>> $log }
  'luna' { codex exec -m gpt-6-luna  -s workspace-write -c sandbox_workspace_write.network_access=true --add-dir "$repo\.git" -C $wt $prompt *>> $log }
  'grok' { omp -p --auto-approve --no-session --model xai-oauth/grok-4.7 --cwd $wt $prompt *>> $log }
}
"=== $(Get-Date -Format s) END exit=$LASTEXITCODE" | Out-File $log -Append -Encoding utf8
git -C $wt log --oneline main..HEAD | Out-File $log -Append -Encoding utf8
