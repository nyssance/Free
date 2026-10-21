$ErrorActionPreference = "Stop"
$zh = (Get-UICulture).Name -like "zh*"

$dir = if ($env:FREE_INSTALL_DIR) { $env:FREE_INSTALL_DIR } else { Join-Path $env:LOCALAPPDATA "Programs\Free" }
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$exe = Join-Path $dir "free.exe"
Invoke-WebRequest -Uri "https://github.com/nyssance/Free/releases/latest/download/free-windows-x64.exe.gz" -OutFile "$exe.gz"
$gz = [IO.File]::OpenRead("$exe.gz")
$out = [IO.File]::Create($exe)
[IO.Compression.GZipStream]::new($gz, [IO.Compression.CompressionMode]::Decompress).CopyTo($out)
$out.Close()
$gz.Close()
Remove-Item "$exe.gz"
Unblock-File $exe
Write-Host $(if ($zh) { "已安装 $exe" } else { "Installed $exe" })

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if (($userPath -split ";") -notcontains $dir) {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$dir", "User")
    $env:Path += ";$dir"
    Write-Host $(if ($zh) { "已把 $dir 加入用户 PATH" } else { "Added $dir to user PATH" })
}
Write-Host $(if ($zh) { "运行 free 开始" } else { "Run free to start" })
