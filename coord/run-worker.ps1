# Usage: .\coord\run-worker.ps1 -Worker sol|luna|grok|vachana -Task T02-core-logic -Branch t02-core-logic [-NoJunction]
# Each worker gets its own local clone (git data inside the folder, so sandboxed Codex can commit).
# Boss merges with: git fetch D:\projects\vs-wt\<branch> <branch>:<branch>; git merge --no-ff <branch>
# Vachana: ONE call at a time (parallel calls trigger Cloudflare 403). Always explicit model: sonnet (normal) / opus (hard, reviews).
param([string]$Worker, [string]$Task, [string]$Branch, [switch]$NoJunction, [string]$Model = 'sonnet')
$ErrorActionPreference = 'Continue'
$repo = 'D:\projects\vibe_sprint'
$wt = "D:\projects\vs-wt\$Branch"
$log = "$repo\coord\logs\$Task-$Worker.log"
if (-not (Test-Path $wt)) {
  git clone -q $repo $wt 2>&1 | Out-Null
  git -C $wt checkout -q -b $Branch 2>&1 | Out-Null
}
# own node_modules per clone (sandboxed tools can't write a shared one)
if (-not $NoJunction -and (Test-Path "$wt\package-lock.json") -and -not (Test-Path "$wt\node_modules")) {
  Push-Location $wt; npm ci --prefer-offline --no-audit --no-fund *> $null; Pop-Location
}
$prompt = "You are a worker on a hackathon repo. Read AGENTS.md, coord/CONTRACT.md and coord/tasks/$Task.md, then do exactly that task in this directory (your own git clone, branch $Branch). Only modify files inside this directory. Do not push or merge. "
if ($Worker -in 'sol','luna') {
  $prompt += "Your sandbox cannot write .git, so do NOT run git commit. Instead, as you finish each small working step, append one line to coord/results/$Task.commits in the form '<conventional commit message> | <space-separated file or folder paths>' (paths relative to repo root, in the order they should be committed; aim for 6-12 small commits). The boss commits them. When done write coord/results/$Task.md and exit."
} else {
  $prompt += "Commit each small working step yourself with a conventional message (aim for 6-12 small commits). When done write coord/results/$Task.md, commit it, and exit."
}
Set-Location $wt
"=== $(Get-Date -Format s) START $Worker $Task in $wt" | Out-File $log -Encoding utf8
switch ($Worker) {
  'vachana' {
    $env:CLAUDE_CONFIG_DIR = "$env:USERPROFILE\.claude-vachana"
    $allow = @('Read','Edit','Write','Glob','Grep','Skill',
      'Bash(npm *)','Bash(npx *)','Bash(git *)','Bash(node *)','Bash(mkdir *)','Bash(cp *)','Bash(mv *)','Bash(ls *)','Bash(cat *)',
      'PowerShell(npm *)','PowerShell(npx *)','PowerShell(git *)','PowerShell(node *)','PowerShell(New-Item *)','PowerShell(Copy-Item *)','PowerShell(Move-Item *)','PowerShell(Get-ChildItem *)')
    claude -p $prompt --output-format json --model $Model --permission-mode acceptEdits --allowedTools $allow *>> $log
    Remove-Item Env:\CLAUDE_CONFIG_DIR
  }
  'sol'  { codex exec -m gpt-6.1-sol -s workspace-write -c sandbox_workspace_write.network_access=true -C $wt $prompt *>> $log }
  'luna' { codex exec -m gpt-6-luna  -s workspace-write -c sandbox_workspace_write.network_access=true -C $wt $prompt *>> $log }
  'grok' { omp -p --auto-approve --no-session --model xai-oauth/grok-4.7 --cwd $wt $prompt *>> $log }
}
"=== $(Get-Date -Format s) END exit=$LASTEXITCODE" | Out-File $log -Append -Encoding utf8
git -C $wt log --oneline main..HEAD | Out-File $log -Append -Encoding utf8
