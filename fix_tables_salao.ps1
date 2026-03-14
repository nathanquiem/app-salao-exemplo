$filePath = "src\app\adminsalao\page.tsx"
$content = Get-Content $filePath -Raw -Encoding UTF8

# barber_services (deve vir ANTES de barbers e services para nao colidir)
$content = $content -replace "\.from\('barber_services'\)", ".from('barber_services_salao')"
# bookings
$content = $content -replace "\.from\('bookings'\)", ".from('bookings_salao')"
# services (apenas a tabela do banco, nao o storage bucket)
$content = $content -replace "supabase\.from\('services'\)", "supabase.from('services_salao')"
# barbers (apenas a tabela, nao o storage bucket)  
$content = $content -replace "supabase\.from\('barbers'\)", "supabase.from('barbers_salao')"
# profiles
$content = $content -replace "\.from\('profiles'\)", ".from('profiles_salao')"
# business_config
$content = $content -replace "\.from\('business_config'\)", ".from('business_config_salao')"

# Corrigir os .select() inline que referenciam tabelas relacionadas
$content = $content -replace "services \(name, price, duration_minutes\)", "services_salao (name, price, duration_minutes)"
$content = $content -replace "services\(name, duration_minutes, price\)", "services_salao(name, duration_minutes, price)"
$content = $content -replace "services\(price\)", "services_salao(price)"
$content = $content -replace "profiles:client_id \(id, full_name, created_at, phone\)", "profiles_salao:client_id (id, full_name, created_at, phone)"
$content = $content -replace "barbers \(name\)", "barbers_salao (name)"
$content = $content -replace "\*, barber_services\(service_id\)", "*, barber_services_salao(service_id)"

# Corrigir referencias de barber_services em acessos a objetos JS
$content = $content -replace "barber_services\?\.map\(", "barber_services_salao?.map("
$content = $content -replace "barber\.barber_services", "barber.barber_services_salao"

Set-Content -Path $filePath -Value $content -Encoding UTF8 -NoNewline
Write-Host "DONE: adminsalao/page.tsx atualizado com sucesso!"
