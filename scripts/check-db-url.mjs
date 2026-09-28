/**
 * Checks a Postgres connection string before anything tries to use it.
 *
 *   node scripts/check-db-url.mjs DIRECT_URL migrate
 *   node scripts/check-db-url.mjs DATABASE_URL runtime
 *
 * This exists because Prisma's own failure is `P1000: Authentication failed ... the
 * provided database credentials for "postgres" are not valid`, which reads as a wrong
 * password. On Supabase's shared pooler it usually is not: the pooler identifies the
 * project from the *username*, so it must be `postgres.<project-ref>` rather than plain
 * `postgres`. Someone who assembled the string by hand, or edited a direct-connection
 * string to point at the pooler, gets an authentication error naming a password that is
 * perfectly correct.
 *
 * Every message here says which part is wrong and what it should look like. The password
 * is never printed — the whole string is a credential, and CI logs are not private.
 */

const [, , variableName = 'DATABASE_URL', mode = 'runtime'] = process.argv;
const raw = process.env[variableName];

const problems = [];
const warnings = [];

function fail(message) {
  problems.push(message);
}

if (!raw || raw.trim() === '') {
  console.error(`\n${variableName} is not set.\n`);
  process.exit(1);
}

const value = raw.trim();

/**
 * A password containing @ : / ? # or & must be percent-encoded, or it breaks the URL
 * before anything gets to authenticate. Counting @ is the reliable tell: there should be
 * exactly one, separating credentials from host.
 */
const atCount = (value.match(/@/g) ?? []).length;
if (atCount > 1) {
  fail(
    'The password appears to contain an unencoded "@". Percent-encode it as %40 — and encode any : / ? # & too, or the URL splits in the wrong place.',
  );
}

let url;
try {
  url = new URL(value);
} catch {
  fail('This is not a valid URL. It should start with postgresql:// and hold one line with no spaces or quotes.');
}

if (url) {
  const user = decodeURIComponent(url.username ?? '');
  const password = url.password ?? '';
  const host = url.hostname;
  const port = url.port || '5432';
  const database = url.pathname.replace(/^\//, '');

  // Shown so a mistake is visible, with the password replaced rather than shortened —
  // even a length is a hint worth not publishing.
  console.log(`\n${variableName}`);
  console.log(`  user      ${user || '(none)'}`);
  console.log(`  password  ${password ? '***' : '(none)'}`);
  console.log(`  host      ${host}`);
  console.log(`  port      ${port}`);
  console.log(`  database  ${database || '(none)'}\n`);

  if (!url.protocol.startsWith('postgres')) {
    fail(`The scheme is "${url.protocol.replace(':', '')}". It should be postgresql://`);
  }
  if (!password) {
    fail('There is no password in the string.');
  }
  if (/^\[?(your[-_]?password|password|pass)\]?$/i.test(decodeURIComponent(password))) {
    fail('The password is still the placeholder from the Supabase panel. Replace it with the real database password.');
  }
  if (!database) {
    fail('There is no database name at the end. Supabase strings end in /postgres');
  }

  const isSharedPooler = host.endsWith('pooler.supabase.com');
  const isSupabaseDirect = /^db\..*\.supabase\.co$/.test(host);

  if (isSharedPooler && !user.includes('.')) {
    fail(
      `The username is "${user}", but Supabase's pooler identifies your project from the username. ` +
        'It must be postgres.<project-ref> — for example postgres.abcdefghijklmnop. ' +
        'Copy the string from Supabase: Connect → ORMs → Prisma, rather than editing a direct-connection string.',
    );
  }

  if (mode === 'migrate') {
    if (port === '6543') {
      fail(
        'Port 6543 is the transaction pooler, which cannot run migrations — it does not support the prepared statements Prisma Migrate uses. Use the session pooler, port 5432 on the same host.',
      );
    }
    if (isSupabaseDirect) {
      warnings.push(
        'This is Supabase\'s "Direct connection" host, which answers over IPv6 only unless you have the IPv4 add-on. GitHub Actions runners are IPv4-only, so this will usually fail to connect. The session pooler (port 5432 on pooler.supabase.com) is the one to use here.',
      );
    }
  }

  if (mode === 'runtime' && isSharedPooler && port === '5432') {
    warnings.push(
      'Port 5432 is the session pooler. It works, but the transaction pooler (6543) is what serverless functions want — session mode holds a connection per function instance.',
    );
  }
  if (mode === 'runtime' && port === '6543' && !/pgbouncer=true/.test(value)) {
    warnings.push('Add ?pgbouncer=true&connection_limit=1 to a transaction-pooler URL, or Prisma will use prepared statements the pooler cannot handle.');
  }
}

for (const warning of warnings) console.log(`  warning: ${warning}\n`);

if (problems.length > 0) {
  for (const problem of problems) console.error(`  problem: ${problem}\n`);
  console.error(`${variableName} will not work. Nothing was changed.\n`);
  process.exit(1);
}

console.log(`${variableName} looks usable.\n`);
