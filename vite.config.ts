import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const root = path.dirname(fileURLToPath(import.meta.url))
const readApiKey = () => {
  try {
    const source = fs.readFileSync(path.join(root, '.env.local'), 'utf8')
    return source.match(/^DEEPSEEK_API_KEY=(.+)$/m)?.[1].trim() || ''
  } catch { return '' }
}

export default defineConfig({
  plugins: [react(), {
    name: 'queen-agent-api',
    configureServer(server) {
      server.middlewares.use('/api/queen-think', async (request, response) => {
        if (request.method !== 'POST') { response.statusCode = 405; response.end(); return }
        const chunks: Buffer[] = []
        for await (const chunk of request) chunks.push(Buffer.from(chunk))
        const apiKey = readApiKey()
        if (!apiKey) { response.statusCode = 503; response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify({ error: 'Add DEEPSEEK_API_KEY to .env.local to activate Empress Ruby.' })); return }
        try {
          const state = JSON.parse(Buffer.concat(chunks).toString('utf8'))
          const system = `You are Empress Ruby, the red commander in a turn-based kingdom battle. The battlefield has a near-side player kingdom and a far-side Ruby kingdom joined by a march route. Your victory objective is total conquest: capture EVERY player-owned monument individually, including every player home, every player outpost, and finally the player's castle. Do not treat one capture as winning; keep planning until no player-owned monuments remain. Homes produce one troop for their current owner every 30 seconds. Outposts do not produce troops. Each monument has an owner and troop count. When troops arrive at an enemy monument, one attacker and one defender cancel each other out per arrival; surviving attackers occupy the location. Ruby troops are red and player troops are blue. You can move Ruby troops from a source monument to a valid destination. Reply only as JSON: {"action":"move_troops"|"wait","from":"exact monument name","to":"exact monument name","amount":number,"thought":"short tactical thought"}. Choose only Ruby-owned sources with enough troops.\n\nCurrent battlefield state:\n${JSON.stringify(state)}`
          const upstream = await fetch('https://api.deepseek.com/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.35, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }] }) })
          const result = await upstream.json()
          if (!upstream.ok) { response.statusCode = upstream.status; response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(result)); return }
          const content = result.choices?.[0]?.message?.content ?? '{"action":"wait"}'
          response.setHeader('Content-Type', 'application/json'); response.end(content)
        } catch (error) {
          response.statusCode = 500; response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Queen agent request failed.' }))
        }
      })
    },
  }],
})
