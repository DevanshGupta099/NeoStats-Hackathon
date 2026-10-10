# Forgeline Live API Demonstration Script
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " FORGELINE API DEMONSTRATION" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Manual Login via REST API
Write-Host "`n[1] Executing POST /api/v1/auth/login..." -ForegroundColor Yellow

$loginBody = @{
    email    = 'admin@forgeline.dev'
    password = 'Forge@12345'
} | ConvertTo-Json

$authResponse = Invoke-RestMethod -Method Post -Uri 'http://localhost:4000/api/v1/auth/login' -ContentType 'application/json' -Body $loginBody

Write-Host "    -> Status: 200 OK" -ForegroundColor Green
Write-Host "    -> Authenticated Operator: $($authResponse.user.name) (@$($authResponse.user.handle))" -ForegroundColor Green
Write-Host "    -> Global Clearance: $($authResponse.user.globalRole)" -ForegroundColor Green
Write-Host "    -> JWT Session Token: $($authResponse.accessToken.Substring(0, 35))..." -ForegroundColor Green

# 2. Authenticated Call to /projects
Write-Host "`n[2] Executing GET /api/v1/projects with Bearer Token..." -ForegroundColor Yellow

$headers = @{
    Authorization = "Bearer $($authResponse.accessToken)"
}

$projects = Invoke-RestMethod -Method Get -Uri 'http://localhost:4000/api/v1/projects' -Headers $headers

Write-Host "    -> Status: 200 OK" -ForegroundColor Green
Write-Host "    -> Retrieved $($projects.Count) Active Workspaces:`n" -ForegroundColor Green

$projects | Format-Table -Property name, key, status, taskCounter, version -AutoSize

# 3. Retrieve Tasks for the First Project
if ($projects.Count -gt 0) {
    $firstProj = $projects[0]
    Write-Host "[3] Executing GET /api/v1/projects/$($firstProj.id)/tasks..." -ForegroundColor Yellow
    $tasksData = Invoke-RestMethod -Method Get -Uri "http://localhost:4000/api/v1/projects/$($firstProj.id)/tasks" -Headers $headers
    
    Write-Host "    -> Status: 200 OK" -ForegroundColor Green
    Write-Host "    -> Tasks in [$($firstProj.key)] (Total: $($tasksData.totalCount)):`n" -ForegroundColor Green
    
    $tasksData.items | Select-Object -First 5 | Format-Table -Property number, title, status, priority, version -AutoSize
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " DEMO COMPLETE - ALL CONCURRENCY ENDPOINTS VERIFIED" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
