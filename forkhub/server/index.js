import app from './app.js'
import { port } from './config.js'

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`)
})
