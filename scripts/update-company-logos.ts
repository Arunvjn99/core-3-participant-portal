#!/usr/bin/env node
/**
 * Update Company Logos Script
 * 
 * This script updates the companies table with logo URLs for dynamic branding.
 * 
 * Usage:
 *   npx tsx scripts/update-company-logos.ts
 * 
 * Requirements:
 *   - VITE_SUPABASE_URL in .env
 *   - VITE_SUPABASE_ANON_KEY in .env
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  console.error('   Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const COMPANIES = [
  {
    slug: 'ascend',
    name: 'Ascend',
    logo_url: '/logos/ascend.svg',
    primary_color: '#1e3a8a',
  },
  {
    slug: 'vanguard',
    name: 'Vanguard',
    logo_url: '/logos/vanguard.svg',
    primary_color: '#811926',
  },
  {
    slug: 'lincoln',
    name: 'Lincoln Financial',
    logo_url: '/logos/lincoln.svg',
    primary_color: '#6B1D4A',
  },
  {
    slug: 'congruent',
    name: 'Congruent Solutions',
    logo_url: '/logos/congruent.svg',
    primary_color: '#7c3aed',
  },
]

async function updateCompanyLogos() {
  console.log('🚀 Starting company logo update...\n')

  for (const company of COMPANIES) {
    console.log(`📝 Processing ${company.name}...`)

    const { data, error } = await supabase
      .from('companies')
      .upsert(
        {
          slug: company.slug,
          name: company.name,
          logo_url: company.logo_url,
          primary_color: company.primary_color,
        },
        { onConflict: 'slug' }
      )
      .select()

    if (error) {
      console.error(`   ❌ Failed: ${error.message}`)
    } else {
      console.log(`   ✅ Updated with logo: ${company.logo_url}`)
    }
  }

  console.log('\n✨ Company logo update complete!')
  console.log('\n📋 Verifying data...')

  const { data: companies, error: fetchError } = await supabase
    .from('companies')
    .select('name, slug, logo_url, primary_color')
    .order('name')

  if (fetchError) {
    console.error('❌ Failed to fetch companies:', fetchError.message)
  } else {
    console.log('\n📊 Current companies:')
    console.table(companies)
  }
}

// Run the script
updateCompanyLogos()
  .then(() => {
    console.log('\n🎉 All done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error)
    process.exit(1)
  })
