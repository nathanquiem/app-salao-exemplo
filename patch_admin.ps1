$f = 'c:\Users\naelq\Documents\Projetos Antigravity\app-salao\src\app\admin\page.tsx'
$c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
$c = $c.Replace('a3f8c1d2-e7b4-4a92-b5f0-9d2e6c8a1f3b', '7e2d9b4f-c1a6-4f83-d0e5-2b8a5f7c3e1d')
$c = $c.Replace('PainelStyllus', 'PainelSalao')
[System.IO.File]::WriteAllText($f, $c, [System.Text.Encoding]::UTF8)
Write-Host 'Done - empresa ID and function name replaced'
