#!/usr/bin/env node

/**
 * Helper script to get Supabase database password instructions
 */

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local')
  process.exit(1)
}

const projectRef = supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)?.[1]

if (!projectRef) {
  console.error('❌ Invalid Supabase URL format')
  process.exit(1)
}

console.log('\n╔════════════════════════════════════════════════════════╗')
console.log('║  Supabase Database Password Talimatları               ║')
console.log('╚════════════════════════════════════════════════════════╝\n')

console.log('📝 Adım 1: Supabase Dashboard\'a git')
console.log(`   https://app.supabase.com/project/${projectRef}/settings/database\n`)

console.log('📝 Adım 2: "Database Password" bölümünü bul')
console.log('   (Sayfa aşağı scroll et)\n')

console.log('📝 Adım 3: Şifreyi kopyala veya "Reset Database Password" ile yeni şifre oluştur\n')

console.log('📝 Adım 4: .env.local dosyasına ekle:')
console.log('   (Dosyayı aç ve en alta ekle)\n')

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`DATABASE_URL=postgresql://postgres:SİFRENİZ_BURAYA@db.${projectRef}.supabase.co:5432/postgres`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

console.log('⚠️  ÖNEMLİ: "SİFRENİZ_BURAYA" yerine gerçek şifreyi yaz!\n')

console.log('📝 Adım 5: Migration\'ı çalıştır:')
console.log('   npm run migrate\n')

console.log('💡 Not: Şifreyi güvenli sakla, başka yerde kullanma!\n')
