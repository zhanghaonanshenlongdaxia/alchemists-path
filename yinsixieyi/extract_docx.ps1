Add-Type -AssemblyName System.IO.Compression.FileSystem
$docPath = "d:\godotProject\test1\game3\yinsixieyi\privacy.docx"
$zip = [System.IO.Compression.ZipFile]::OpenRead($docPath)
$entry = $zip.Entries | Where-Object { $_.Name -eq "document.xml" } | Select-Object -First 1
$reader = New-Object System.IO.StreamReader($entry.Open())
$xml = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()
$text = $xml -replace '<[^>]+>', '' -replace '&amp;', '&' -replace '&lt;', '<' -replace '&gt;', '>' -replace '\s+', ' '
$text | Out-File "d:\godotProject\test1\game3\yinsixieyi\privacy_raw.txt" -Encoding UTF8
Write-Host "Done"
