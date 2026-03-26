$ErrorActionPreference = 'Stop'

$docsDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$htmlPath = Join-Path $docsDir 'Ban_mo_ta_san_pham_EduMind_AI.html'
$docxPath = Join-Path $docsDir 'Ban_mo_ta_san_pham_EduMind_AI.docx'
$pdfPath = Join-Path $docsDir 'Ban_mo_ta_san_pham_EduMind_AI.pdf'

if (-not (Test-Path $htmlPath)) {
  throw "Khong tim thay tep HTML nguon: $htmlPath"
}

$word = $null
$document = $null

try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0

  $document = $word.Documents.Add()
  $document.PageSetup.PaperSize = 7
  $document.PageSetup.TopMargin = $word.CentimetersToPoints(2.2)
  $document.PageSetup.BottomMargin = $word.CentimetersToPoints(2.2)
  $document.PageSetup.LeftMargin = $word.CentimetersToPoints(2.6)
  $document.PageSetup.RightMargin = $word.CentimetersToPoints(2.0)

  $range = $document.Range()
  $range.InsertFile($htmlPath)

  $document.SaveAs2($docxPath, 16)
  $document.ExportAsFixedFormat($pdfPath, 17)
}
finally {
  if ($document -ne $null) {
    $document.Close($false)
  }

  if ($word -ne $null) {
    $word.Quit()
  }

  [System.GC]::Collect()
  [System.GC]::WaitForPendingFinalizers()
}

Write-Output "DOCX=$docxPath"
Write-Output "PDF=$pdfPath"
