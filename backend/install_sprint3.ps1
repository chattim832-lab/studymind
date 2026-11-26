# Installer les nouvelles routes Sprint 3 sans ecraser main.py.
# Mettre ce script dans le dossier backend avec study_routes.py et study_service.py.
$ErrorActionPreference = 'Stop'
$backend = Split-Path -Parent $MyInvocation.MyCommand.Path
$main = Join-Path $backend 'main.py'
$routes = Join-Path $backend 'study_routes.py'
$service = Join-Path $backend 'study_service.py'

foreach ($file in @($main, $routes, $service)) {
    if (-not (Test-Path -LiteralPath $file)) {
        throw "Fichier manquant : $file"
    }
}

$code = [System.IO.File]::ReadAllText($main)
$marker = 'from study_routes import router as study_router'
if ($code.Contains($marker)) {
    Write-Host 'Les routes Sprint 3 sont deja presentes dans main.py.'
} else {
    $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $backup = Join-Path $env:TEMP ("studymind_main_avant_sprint3_$timestamp.py")
    Copy-Item -LiteralPath $main -Destination $backup

    $addition = "`r`n`r`n# SPRINT 3 : Resumes, fiches, QCM et progression`r`n" +
                "from study_routes import router as study_router`r`n" +
                "app.include_router(study_router)`r`n"
    [System.IO.File]::AppendAllText($main, $addition, [System.Text.UTF8Encoding]::new($false))
    Write-Host "Sauvegarde de main.py dans : $backup"
    Write-Host 'Les routes Sprint 3 ont ete ajoutees a main.py.'
}

Write-Host ''
Write-Host 'Verification syntaxique :'
Push-Location $backend
try {
    python -m py_compile main.py study_routes.py study_service.py
    if ($LASTEXITCODE -ne 0) { throw 'Erreur de syntaxe Python.' }
    Write-Host 'Syntaxe Python OK.'
    Write-Host 'Demarre maintenant : python -m uvicorn main:app --host 127.0.0.1 --port 8001'
} finally {
    Pop-Location
}
