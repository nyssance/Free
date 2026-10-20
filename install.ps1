$ErrorActionPreference = "Stop"

$dir = if ($env:FREE_INSTALL_DIR) { $env:FREE_INSTALL_DIR } else { Join-Path $env:LOCALAPPDATA "Programs\Free" }
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$exe = Join-Path $dir "free.exe"
$arch = if ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture -eq "Arm64") { "arm64" } else { "x64" }
Invoke-WebRequest -Uri "https://github.com/nyssance/Free/releases/latest/download/free-windows-$arch.exe" -OutFile $exe
Unblock-File $exe
Write-Host "已安装 $exe"

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if (($userPath -split ";") -notcontains $dir) {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$dir", "User")
    $env:Path += ";$dir"
    Write-Host "已把 $dir 加入用户 PATH"
}
Write-Host "运行 free 开始"
