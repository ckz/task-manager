import 'dotenv/config'
import { PrismaClient } from './src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

async function main() {
  const connectionString = process.env.DATABASE_URL!
  console.log('DB URL:', connectionString.substring(0, 50) + '...')
  
  const adapter = new PrismaPg({ connectionString })
  const db = new PrismaClient({ adapter })
  
  const apiKey = 'tm_test_key_1234567890abcdef'
  const hash = await bcrypt.hash(apiKey, 10)
  
  console.log('Hash:', hash)
  
  const agent = await db.agent.upsert({
    where: { id: 'test-agent-001' },
    update: { apiKeyHash: hash, status: 'ACTIVE' },
    create: {
      id: 'test-agent-001',
      name: 'test-claude-code',
      apiKeyHash: hash,
      status: 'ACTIVE',
    },
  })
  
  console.log('Agent created/updated:', agent.id)
  
  // Verify
  const isValid = await bcrypt.compare(apiKey, agent.apiKeyHash)
  console.log('Verification:', isValid)
  
  await db.$disconnect()
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
