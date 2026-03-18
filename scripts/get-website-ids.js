#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })
const { Client } = require('pg')

async function getWebsiteIds() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    const result = await client.query(`
      SELECT id, name, domain 
      FROM websites 
      ORDER BY name
    `)

    console.log('\n📋 Website IDs:\n')
    result.rows.forEach(row => {
      console.log(`${row.name.padEnd(25)} → ${row.domain.padEnd(30)} → ${row.id}`)
    })
    console.log('')
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await client.end()
  }
}

getWebsiteIds()
