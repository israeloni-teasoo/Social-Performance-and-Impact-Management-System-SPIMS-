import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, Prisma } from '@prisma/client';
import { PROJECTS, PROJECT_IMPACTS, COMMUNITIES, INDICATORS, REPORTS, STAKEHOLDERS, TEAM_MEMBERS, TASKS, APPROVALS, EVIDENCE_ITEMS, TARGETS, CUSTOM_FIELDS } from '../frontend/src/data/seed';
import { DEMO_ACCOUNTS } from '../frontend/src/data/accounts';

const prisma = new PrismaClient();

/** Prisma's Json input type needs structurally-JSON types with an index signature; our
 * frontend interfaces don't have one, so round-trip through JSON to satisfy it safely. */
function asJson<T>(value: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value));
}

// TASKS/APPROVALS in the frontend seed reference projects by a free-text label
// (e.g. "Water Scheme · Ovhor") rather than a project code, since that's all the
// client-side prototype ever needed. This maps those labels back to real project
// ids so the seeded FieldTask rows can carry a genuine foreign key.
const PROJECT_LABEL_TO_ID: Record<string, string> = {
  STEP: 'STEP',
  'Eye Can See': 'EYE',
  'Water Scheme': 'WATER',
  YEP: 'YEP',
};

function resolveProjectId(label: string): string | null {
  for (const [needle, id] of Object.entries(PROJECT_LABEL_TO_ID)) {
    if (label.includes(needle)) return id;
  }
  return null;
}

async function main() {
  console.log('Seeding projects...');
  for (const p of PROJECTS) {
    await prisma.project.upsert({
      where: { id: p.id },
      create: { ...p },
      update: { ...p },
    });
  }

  console.log('Seeding project impacts...');
  for (const code of Object.keys(PROJECT_IMPACTS)) {
    const imp = PROJECT_IMPACTS[code];
    await prisma.projectImpact.upsert({
      where: { projectId: code },
      create: {
        projectId: code,
        projectCode: imp.projectCode,
        inputs: imp.inputs,
        activities: imp.activities,
        outputHeadline: imp.outputHeadline,
        outcome: imp.outcome,
        reach: imp.reach ? asJson(imp.reach) : undefined,
        impactHeadline: imp.impactHeadline,
        impactFigure: imp.impactFigure,
        impactFigureLabel: imp.impactFigureLabel,
        impactPoints: asJson(imp.impactPoints),
        methodology: asJson(imp.methodology),
        impactScenarios: imp.impactScenarios ? asJson(imp.impactScenarios) : undefined,
        impactScenarioBasis: imp.impactScenarioBasis ?? null,
        baseline: asJson(imp.baseline),
        baselineCaption: imp.baselineCaption,
        dualLens: asJson(imp.dualLens),
        costPerOutcome: imp.costPerOutcome,
        sroi: imp.sroi,
        contactPerson: imp.contactPerson,
        communitiesImpacted: asJson(imp.communitiesImpacted),
      },
      update: {
        outputHeadline: imp.outputHeadline,
        outcome: imp.outcome,
        reach: imp.reach ? asJson(imp.reach) : undefined,
        impactHeadline: imp.impactHeadline,
        impactFigure: imp.impactFigure,
        impactFigureLabel: imp.impactFigureLabel,
        impactPoints: asJson(imp.impactPoints),
        methodology: asJson(imp.methodology),
        impactScenarios: imp.impactScenarios ? asJson(imp.impactScenarios) : undefined,
        impactScenarioBasis: imp.impactScenarioBasis ?? null,
        baseline: asJson(imp.baseline),
        baselineCaption: imp.baselineCaption,
        dualLens: asJson(imp.dualLens),
        costPerOutcome: imp.costPerOutcome,
        sroi: imp.sroi,
        contactPerson: imp.contactPerson,
        communitiesImpacted: asJson(imp.communitiesImpacted),
      },
    });
  }

  console.log('Seeding communities...');
  for (const c of COMMUNITIES) {
    await prisma.community.upsert({ where: { id: c.id }, create: { ...c }, update: { ...c } });
  }

  console.log('Seeding indicators...');
  for (const i of INDICATORS) {
    await prisma.indicator.upsert({ where: { id: i.id }, create: { ...i }, update: { ...i } });
  }

  console.log('Seeding reports...');
  for (const r of REPORTS) {
    await prisma.report.upsert({ where: { id: r.id }, create: { ...r }, update: { ...r } });
  }

  console.log('Seeding stakeholders...');
  for (const s of STAKEHOLDERS) {
    await prisma.stakeholder.upsert({ where: { id: s.id }, create: { ...s }, update: { ...s } });
  }

  console.log('Seeding team members...');
  for (const t of TEAM_MEMBERS) {
    await prisma.teamMember.upsert({ where: { id: t.id }, create: { ...t }, update: { ...t } });
  }

  console.log('Seeding evidence items...');
  for (const e of EVIDENCE_ITEMS) {
    await prisma.evidenceItem.upsert({ where: { id: e.id }, create: { ...e }, update: { ...e } });
  }

  console.log('Seeding demo users...');
  const userIds: Record<string, string> = {};
  for (const a of DEMO_ACCOUNTS) {
    const passwordHash = await bcrypt.hash(a.password, 10);
    const initials = a.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase();
    const user = await prisma.user.upsert({
      where: { email: a.email },
      create: { email: a.email, passwordHash, name: a.name, role: a.role, roleLabel: a.roleLabel, initials },
      update: { passwordHash, name: a.name, role: a.role, roleLabel: a.roleLabel, initials },
    });
    userIds[a.role] = user.id;
  }

  console.log('Seeding field tasks...');
  for (const t of TASKS) {
    await prisma.fieldTask.upsert({
      where: { id: t.id },
      create: {
        id: t.id,
        title: t.title,
        projectId: resolveProjectId(t.project),
        projectLabel: t.project,
        due: t.due,
        dueColor: t.dueColor,
        assigneeId: t.assigneeId ?? null,
        status: t.status ?? 'Not started',
        createdBy: t.createdBy ?? null,
      },
      update: {
        title: t.title,
        due: t.due,
        dueColor: t.dueColor,
        assigneeId: t.assigneeId ?? null,
        status: t.status ?? 'Not started',
      },
    });
  }

  console.log('Seeding approvals...');
  for (const a of APPROVALS) {
    await prisma.approval.upsert({
      where: { id: a.id },
      create: { id: a.id, who: a.who, item: a.item, project: a.project, when: a.when, type: a.type, details: a.details },
      update: { who: a.who, item: a.item, project: a.project, when: a.when, type: a.type, details: a.details },
    });
  }

  console.log('Seeding targets...');
  for (const t of TARGETS) {
    const { createdAt, ...rest } = t;
    await prisma.target.upsert({
      where: { id: t.id },
      create: { ...rest, createdAt: new Date(createdAt) },
      update: { ...rest, createdAt: new Date(createdAt) },
    });
  }

  console.log('Seeding custom fields...');
  for (const f of CUSTOM_FIELDS) {
    await prisma.customField.upsert({
      where: { id: f.id },
      create: { ...f },
      update: { ...f },
    });
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
