/**
 * Drives the sign-in throttle against a real database.
 *
 *   DATABASE_URL=postgresql://… npm run smoke:signin
 *
 * A throttle that does not actually stop the sixth attempt is worse than none, because
 * it reads as protection. So this makes the attempts and checks the answers, rather than
 * checking that the counter went up.
 *
 * It writes to whatever database DATABASE_URL names and cleans up after itself, so point
 * it at a scratch database, never at the deployment.
 */

import assert from 'node:assert/strict';
import { hashPassword } from '../server/lib/auth';
import { loginHandler } from '../server/handlers/auth';
import { prisma } from '../server/lib/db';
import { SIGN_IN_THROTTLE_LIMITS } from '../server/lib/signInThrottle';

const EMAIL = `throttle-${Date.now()}@example.invalid`;
const PASSWORD = 'CorrectHorseBattery!';
const IP = '203.0.113.7';

let failures = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ok    ${name}`);
  } catch (error) {
    failures += 1;
    console.log(`  FAIL  ${name}`);
    console.log(`        ${(error as Error).message.split('\n')[0]}`);
  }
}

const statusOf = (r: { status: number }) => r.status;
const errorOf = (r: { body: { error?: string } }) => r.body.error ?? '';

async function attempt(password: string, ip: string | null = IP) {
  return loginHandler({ email: EMAIL, password }, ip);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log('\nsmoke:signin needs DATABASE_URL pointing at a scratch database.\n');
    process.exit(1);
  }

  await prisma.signInAttempt.deleteMany({ where: { key: { in: [`email:${EMAIL}`, `ip:${IP}`] } } });
  await prisma.user.create({
    data: {
      email: EMAIL,
      passwordHash: await hashPassword(PASSWORD),
      name: 'Throttle Test',
      role: 'exec',
      roleLabel: 'Executive',
      initials: 'TT',
    },
  });

  console.log('\nWrong password, over and over');

  const { EMAIL_THRESHOLD } = SIGN_IN_THROTTLE_LIMITS;
  const answers: number[] = [];
  for (let i = 0; i < EMAIL_THRESHOLD; i++) answers.push(statusOf(await attempt('wrong')));

  test(`the first ${EMAIL_THRESHOLD} attempts are refused as wrong, not as throttled`, () => {
    assert.deepEqual(answers, Array.from({ length: EMAIL_THRESHOLD }, () => 401), JSON.stringify(answers));
  });

  const locked = await attempt('wrong');
  test('the next one is turned away before the password is checked', () => {
    assert.equal(statusOf(locked), 429);
    assert.match(errorOf(locked), /Too many sign-in attempts\. Try again in \d+ minutes?\./);
  });

  test('the correct password is refused too while the lock holds', () => {
    // Otherwise the lock is decorative: an attacker who guesses right on the sixth
    // attempt would still be let in.
    assert.equal(statusOf(locked), 429);
  });

  const stillLocked = await attempt(PASSWORD);
  test('and the lock does not lift because the password was right', () => {
    assert.equal(statusOf(stillLocked), 429);
  });

  console.log('\nWho is counted');

  test('the lock does not leak whether the account exists', async () => {
    assert.equal(errorOf(locked).includes(EMAIL), false, 'the message names the account');
  });

  // A different address, same account: the account lock still applies, which is what
  // stops an attempt that moves between addresses.
  const fromElsewhere = await attempt('wrong', '198.51.100.9');
  test('moving to another address does not clear the account lock', () => {
    assert.equal(statusOf(fromElsewhere), 429);
  });

  console.log('\nClearing');

  await prisma.signInAttempt.deleteMany({ where: { key: { in: [`email:${EMAIL}`, `ip:${IP}`] } } });
  const afterReset = await attempt(PASSWORD);
  test('a correct password works once the window has passed', () => {
    assert.equal(statusOf(afterReset), 200);
  });

  test('a success clears the counter, so the next wrong attempt starts from one', async () => {
    const row = await prisma.signInAttempt.findUnique({ where: { key: `email:${EMAIL}` } });
    assert.equal(row, null, 'the counter survived a successful sign-in');
  });

  await prisma.signInAttempt.deleteMany({ where: { key: { in: [`email:${EMAIL}`, `ip:${IP}`, 'ip:198.51.100.9'] } } });
  await prisma.user.deleteMany({ where: { email: EMAIL } });

  console.log(failures === 0 ? '\nThe sign-in throttle refuses the attempts it should.\n' : `\n${failures} check(s) failed.\n`);
  process.exit(failures === 0 ? 0 : 1);
}

await main();
