$filePath = "src\components\BookingModal.tsx"
$content = Get-Content $filePath -Raw -Encoding UTF8

# barber_services (deve vir ANTES de barbers e services)
$content = $content -replace "\.from\('barber_services'\)", ".from('barber_services_salao')"
# bookings
$content = $content -replace "\.from\('bookings'\)", ".from('bookings_salao')"
# services (apenas tabela do banco, não storage bucket)
$content = $content -replace "supabase\.from\('services'\)", "supabase.from('services_salao')"
# barbers (apenas tabela, não storage bucket)
$content = $content -replace "supabase\.from\('barbers'\)", "supabase.from('barbers_salao')"

# Corrigir os selects de relacionamento
$content = $content -replace "\.select\('id, barber_services\(service_id\)'\)", ".select('id, barber_services_salao(service_id)')"
$content = $content -replace "barber_services!inner\(service_id\)", "barber_services_salao!inner(service_id)"

Set-Content -Path $filePath -Value $content -Encoding UTF8 -NoNewline
Write-Host "DONE: BookingModal.tsx do salao atualizado!"
