import 'dotenv/config';
import { app } from './app';

const port = Number(process.env.API_PORT ?? 8787);

// 0.0.0.0 so the process is reachable from outside its container; in the supported
// deployment only the reverse proxy can reach this port, never the network at large.
const host = process.env.API_HOST ?? '0.0.0.0';

app.listen(port, host, () => {
  console.log(`SPIMS API listening on http://${host}:${port}`);
});
