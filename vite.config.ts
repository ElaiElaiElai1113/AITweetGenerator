import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import type { Connect, Plugin, ViteDevServer } from 'vite'
import type { IncomingMessage, ServerResponse } from 'http'

// Custom plugin to handle Gemini API proxy with colon in path
function geminiProxyPlugin() {
  type ProxyRequest = IncomingMessage & { url?: string; method?: string; headers: IncomingMessage['headers'] };
  type ProxyResponse = ServerResponse<IncomingMessage>;
  type NextFunction = Connect.NextFunction;

  return {
    name: 'gemini-proxy',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: ProxyRequest, res: ProxyResponse, next: NextFunction) => {
        if (req.url?.startsWith('/gemini-api/')) {
          // Remove the /gemini-api prefix
          const targetPath = req.url.replace('/gemini-api', '')
          const targetUrl = `https://generativelanguage.googleapis.com${targetPath}`

          try {
            // Collect request body for POST requests
            let body: string | undefined
            if (req.method === 'POST') {
              const chunks: Buffer[] = []
              for await (const chunk of req) {
                chunks.push(chunk)
              }
              body = Buffer.concat(chunks).toString()
            }

            const googApiKeyHeader = req.headers['x-goog-api-key']
            const googApiKey = Array.isArray(googApiKeyHeader)
              ? googApiKeyHeader[0]
              : googApiKeyHeader

            const response = await fetch(targetUrl, {
              method: req.method,
              headers: {
                'Content-Type': req.headers['content-type'] || 'application/json',
                'host': 'generativelanguage.googleapis.com',
                ...(googApiKey
                  ? { 'x-goog-api-key': googApiKey }
                  : {}),
              },
              body: body,
            })

            const data = await response.arrayBuffer()
            res.writeHead(response.status, {
              'content-type': response.headers.get('content-type') || 'application/json',
              'access-control-allow-origin': '*',
            })
            res.end(Buffer.from(data))
          } catch (error) {
            console.error('Gemini proxy error:', error)
            res.writeHead(500, { 'content-type': 'application/json' })
            res.end(JSON.stringify({ error: 'Proxy error' }))
          }
        } else {
          next()
        }
      })
    },
  } satisfies Plugin
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), geminiProxyPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/hf-api': {
        target: 'https://api-inference.huggingface.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/hf-api/, ''),
        secure: true,
      },
    }
  },
})
