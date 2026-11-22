$ErrorActionPreference = "Stop"
$zh = (Get-UICulture).Name -like "zh*"

$dir = if ($env:FREE_INSTALL_DIR) { $env:FREE_INSTALL_DIR } else { Join-Path $env:LOCALAPPDATA "Programs\Free" }
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$exe = Join-Path $dir "free.exe"
# One release for both files: the executable and the checksum it is verified against.
$latest = [Net.WebRequest]::Create("https://github.com/nyssance/Free/releases/latest").GetResponse()
$tag = $latest.ResponseUri.Segments[-1]
$latest.Close()
$base = "https://github.com/nyssance/Free/releases/download/$tag"
$asset = "free-windows-x64.exe.gz"
Invoke-WebRequest -Uri "$base/$asset" -OutFile "$exe.gz"
Invoke-WebRequest -Uri "$base/SHA256SUMS" -OutFile "$exe.sums"
$sums = Get-Content "$exe.sums"
Remove-Item "$exe.sums"
$line = $sums | Where-Object { $_ -match "\s+$([regex]::Escape($asset))\s*$" }
if (-not $line -or (Get-FileHash "$exe.gz" -Algorithm SHA256).Hash.ToLower() -ne ($line.Trim() -split "\s+")[0].ToLower()) {
    Remove-Item "$exe.gz"
    throw $(if ($zh) { "校验和不一致，未安装" } else { "Checksum mismatch, nothing installed" })
}
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
