$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Speech
$repo=Join-Path $PSScriptRoot '..'
$out=Join-Path $repo 'dist/assets/words/audio'
New-Item -ItemType Directory -Force $out | Out-Null
$ffmpeg=(Get-Command ffmpeg -ErrorAction Stop).Source
$words=@('everyday','ky','ielts','toefl' | ForEach-Object {Get-Content (Join-Path $repo "dist/assets/words/$_.json") -Raw | ConvertFrom-Json | ForEach-Object {$_[0]}} | Sort-Object -Unique)
$s=[System.Speech.Synthesis.SpeechSynthesizer]::new();$s.SelectVoice('Microsoft Zira Desktop');$s.Rate=-1
$format=[System.Speech.AudioFormat.SpeechAudioFormatInfo]::new(22050,[System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen,[System.Speech.AudioFormat.AudioChannel]::Mono)
$entries=@{};$gap=[byte[]]::new(8820)
for($i=0;$i -lt $words.Count;$i+=100){
 $pack=[int]($i/100);$file=('en-{0:D3}.mp3' -f $pack);$raw=Join-Path ([IO.Path]::GetTempPath()) ('echoo-word-pack-'+$PID+'.raw');$output=[IO.File]::Create($raw);$offset=0
 try{for($j=$i;$j -lt [Math]::Min($i+100,$words.Count);$j++){
  $stream=[IO.MemoryStream]::new();$s.SetOutputToAudioStream($stream,$format);$s.Speak($words[$j]);$s.SetOutputToNull();$bytes=$stream.ToArray();$stream.Dispose()
  if($bytes.Length -lt 100) {throw "Empty voice: $($words[$j])"}
  $entries[$words[$j]]=@($file,[Math]::Round($offset/44100,5),[Math]::Round($bytes.Length/44100,5));$output.Write($bytes);$output.Write($gap);$offset+=$bytes.Length+$gap.Length
 }}finally{$output.Dispose()}
 & $ffmpeg -hide_banner -loglevel error -y -f s16le -ar 22050 -ac 1 -i $raw -codec:a libmp3lame -b:a 48k (Join-Path $out $file)
 if($LASTEXITCODE -ne 0){throw 'Encoding failed'}
 if($pack%10 -eq 0){Write-Output "Generated $([Math]::Min($i+100,$words.Count)) / $($words.Count)"}
}
$s.Dispose()
@{voice='Microsoft Zira Desktop';language='en-US';kind='synthetic';words=$entries} | ConvertTo-Json -Depth 5 -Compress | Set-Content (Join-Path $out 'index.json') -Encoding utf8
Write-Output "COMPLETE $($words.Count) pronunciations"

