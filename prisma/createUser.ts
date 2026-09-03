import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { PrismaClient } from '@prisma/client';
import type { Role } from '@prisma/client';
import { hashPassword } from '../server/lib/auth';

/**
 * Creates a real user account.
 *
 * The demo seed exists to make the prototype explorable and its passwords are
 * published in the repository, so those accounts must never be the way anyone signs
 * in to a live deployment. SPIMS has no user-management screen yet, so this script is
 * how a self-hosted install provisions its first genuine account.
 *
 *   npm run create:user -- --email a@seplat.com --name "A Name" --role exec
 *
 * The password is never passed as an argument, so it stays out of shell history and
 * the process list. It is read interactively when there is a terminal, and otherwise
 * from piped stdin or SPIMS_NEW_USER_PASSWORD so the script can also run unattended
 * from a provisioning playbook.
 */

const ROLE_LABELS: Record<Role, string> = {
  exec: 'Executive',
  manager: 'Project Manager',
  field: 'Field Officer',
  relations: 'Community Relations',
};

const VALID_ROLES = Object.keys(ROLE_LABELS) as Role[];

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

function initialsFrom(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

function usage(message: string): never {
  console.error(`\n${message}\n`);
  console.error('Usage: npm run create:user -- --email <email> --name "<full name>" --role <role>');
  console.error(`Roles: ${VALID_ROLES.join(', ')}\n`);
  process.exit(1);
}

/**
 * Reads the password without ever putting it in argv.
 *
 * Interactively this prompts twice and checks the two match. Non-interactively
 * (a pipe, or a provisioning script) it takes the first line of stdin, or
 * SPIMS_NEW_USER_PASSWORD. An earlier version always used readline, which hangs
 * forever on piped input and then exits silently with success — a failure mode that
 * would have looked like the account was created when it was not.
 */
async function readPassword(): Promise<string> {
  const fromEnv = process.env.SPIMS_NEW_USER_PASSWORD;
  if (fromEnv) return fromEnv;

  if (stdin.isTTY) {
    const rl = createInterface({ input: stdin, output: stdout });
    try {
      const password = await rl.question('Password (min 12 characters): ');
      const confirm = await rl.question('Confirm password: ');
      if (password !== confirm) usage('Passwords do not match.');
      return password;
    } finally {
      rl.close();
    }
  }

  const chunks: Buffer[] = [];
  for await (const chunk of stdin) chunks.push(Buffer.from(chunk));
  const piped = Buffer.concat(chunks).toString('utf8').split(/\r?\n/)[0] ?? '';
  if (!piped) {
    usage('No terminal available and nothing on stdin. Pipe the password in, or set SPIMS_NEW_USER_PASSWORD.');
  }
  return piped;
}

async function main() {
  const email = arg('email')?.trim().toLowerCase();
  const name = arg('name')?.trim();
  const role = arg('role')?.trim() as Role | undefined;

  if (!email || !email.includes('@')) usage('A valid --email is required.');
  if (!name) usage('A --name is required.');
  if (!role || !VALID_ROLES.includes(role)) usage(`--role must be one of: ${VALID_ROLES.join(', ')}`);

  const prisma = new PrismaClient();
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) usage(`A user with the email ${email} already exists.`);

    const password = await readPassword();
    if (!password) usage('No password supplied.');
    if (password.length < 12) usage('Password must be at least 12 characters.');

    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        roleLabel: ROLE_LABELS[role],
        initials: initialsFrom(name),
        passwordHash: await hashPassword(password),
      },
    });

    console.log(`\nCreated ${user.name} <${user.email}> as ${user.roleLabel}.`);
    console.log('If this is a production deployment, delete the demo accounts before going live:');
    console.log("  npx prisma studio   (or)   DELETE FROM \"User\" WHERE email LIKE '%@seplat.com' AND id <> '<this user id>';\n");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
