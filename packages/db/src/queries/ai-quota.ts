import {
  canUseAiGeneration,
  getPlanLimits,
} from "@project-aqua/swim-core/plans";
import { getTeamPlan } from "./billing";
import {
  countAiGenerationsLastMinutes,
  countAiGenerationsThisMonth,
  recordAiGeneration,
} from "./groups";

const BURST_LIMIT = 5;
const BURST_WINDOW_MINUTES = 10;

export async function assertAndRecordAiGeneration(input: {
  organizationId: string;
  userId?: string;
  kind: "workout" | "relay";
  tokensIn?: number;
  tokensOut?: number;
}) {
  const plan = await getTeamPlan(input.organizationId);
  const used = await countAiGenerationsThisMonth(input.organizationId);
  const gate = canUseAiGeneration(plan, used);
  if (!gate.allowed) {
    throw new Error(gate.reason ?? "Monthly suggestion limit reached");
  }

  const burst = await countAiGenerationsLastMinutes(
    input.organizationId,
    BURST_WINDOW_MINUTES,
  );
  if (burst >= BURST_LIMIT) {
    throw new Error(
      `Too many suggestions in a short window. Wait a few minutes (max ${BURST_LIMIT} per ${BURST_WINDOW_MINUTES} minutes).`,
    );
  }

  await recordAiGeneration(input);
  return {
    plan,
    used: used + 1,
    remaining: Math.max(0, gate.remaining - 1),
  };
}

export async function getAiQuotaStatus(organizationId: string) {
  const plan = await getTeamPlan(organizationId);
  const used = await countAiGenerationsThisMonth(organizationId);
  const gate = canUseAiGeneration(plan, used);
  const limits = getPlanLimits(plan);
  return {
    plan,
    used,
    remaining: gate.remaining,
    included: limits.aiGenerationsIncluded,
    allowed: gate.allowed,
    overageAllowed: limits.aiOverageAllowed,
  };
}
