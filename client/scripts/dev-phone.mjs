import os from 'node:os'
import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import qrcode from 'qrcode-terminal'

const clientPort = process.env.PORT ?? process.env.VITE_PORT ?? '3001'
const apiPort = process.env.API_PORT ?? '3000'
const scriptDir = dirname(fileURLToPath(import.meta.url))
const clientDir = resolve(scriptDir, '..')

function getLanAddress() {
  const interfaces = os.networkInterfaces()

  for (const addresses of Object.values(interfaces)) {
    for (const address of addresses ?? []) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address
      }
    }
  }

  throw new Error('Could not find a LAN IPv4 address for QR access.')
}

const host = process.env.DEV_HOST ?? getLanAddress()
const clientUrl = `http://${host}:${clientPort}`
const apiBaseUrl = process.env.VITE_API_BASE_URL ?? `http://${host}:${apiPort}`
const viteCommand = resolve(
  clientDir,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'vite.cmd' : 'vite',
)

console.log(`Phone URL: ${clientUrl}`)
console.log(`API URL: ${apiBaseUrl}`)
qrcode.generate(clientUrl, { small: true })

const devServer = spawn(
  viteCommand,
  ['dev', '--host', '0.0.0.0', '--port', clientPort],
  {
    cwd: clientDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      VITE_API_BASE_URL: apiBaseUrl,
    },
  },
)

devServer.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})
