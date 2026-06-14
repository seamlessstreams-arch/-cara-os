import { describe, it, expect } from "vitest";

// ══════════════════════════════════════════════════════════════════════════════
// Cara — AGENT REGISTRY TESTS
// ══════════════════════════════════════════════════════════════════════════════

import {
  AGENT_REGISTRY,
  getAgent,
  getAgentsForRole,
} from "../agents/agent-registry";
import { AGENT_IDS } from "@/types/cara-reports";

describe("AGENT_REGISTRY", () => {
  it("contains all 8 defined agent IDs", () => {
    for (const id of AGENT_IDS) {
      expect(AGENT_REGISTRY[id], `Missing agent: ${id}`).toBeDefined();
    }
  });

  it("every agent has required fields", () => {
    for (const agent of Object.values(AGENT_REGISTRY)) {
      expect(agent.id).toBeDefined();
      expect(agent.name).toBeDefined();
      expect(agent.description).toBeDefined();
      expect(agent.allowedActions.length).toBeGreaterThan(0);
      expect(agent.prohibitedActions.length).toBeGreaterThan(0);
      expect(agent.riskLevel).toBeDefined();
      expect(agent.requiredRoles.length).toBeGreaterThan(0);
      expect(typeof agent.requiresHumanApproval).toBe("boolean");
      expect(agent.outputTypes.length).toBeGreaterThan(0);
    }
  });

  it("safeguarding agent requires human approval", () => {
    const agent = AGENT_REGISTRY.safeguarding_agent;
    expect(agent.requiresHumanApproval).toBe(true);
    expect(agent.riskLevel).toBe("high");
  });

  it("risk assessment agent requires human approval", () => {
    const agent = AGENT_REGISTRY.risk_assessment_agent;
    expect(agent.requiresHumanApproval).toBe(true);
    expect(agent.riskLevel).toBe("high");
  });

  it("filing agent does not require human approval", () => {
    const agent = AGENT_REGISTRY.filing_agent;
    expect(agent.requiresHumanApproval).toBe(false);
    expect(agent.riskLevel).toBe("low");
  });

  it("no agent has overlapping allowed and prohibited actions", () => {
    for (const agent of Object.values(AGENT_REGISTRY)) {
      const allowedSet = new Set(agent.allowedActions);
      for (const prohibited of agent.prohibitedActions) {
        expect(
          allowedSet.has(prohibited),
          `Agent "${agent.name}" has "${prohibited}" in both allowed and prohibited actions`,
        ).toBe(false);
      }
    }
  });

  it("every agent includes delete_data or equivalent in prohibited actions", () => {
    for (const agent of Object.values(AGENT_REGISTRY)) {
      const hasDeleteProhibition = agent.prohibitedActions.some(
        (a) => a.includes("delete"),
      );
      expect(
        hasDeleteProhibition,
        `Agent "${agent.name}" should prohibit deletion actions`,
      ).toBe(true);
    }
  });
});

describe("getAgent", () => {
  it("returns the correct agent for a valid ID", () => {
    const agent = getAgent("oversight_agent");
    expect(agent.id).toBe("oversight_agent");
    expect(agent.name).toBe("Oversight Agent");
  });

  it("returns the correct agent for every known ID", () => {
    for (const id of AGENT_IDS) {
      const agent = getAgent(id);
      expect(agent.id).toBe(id);
    }
  });
});

describe("getAgentsForRole", () => {
  it("returns all agents for registered_manager", () => {
    const agents = getAgentsForRole("registered_manager");
    expect(agents.length).toBe(8); // RM has access to all agents
  });

  it("returns fewer agents for residential_care_worker", () => {
    const agents = getAgentsForRole("residential_care_worker");
    expect(agents.length).toBeLessThan(8);
    expect(agents.length).toBeGreaterThan(0);
  });

  it("returns no agents for an unknown role", () => {
    const agents = getAgentsForRole("nonexistent_role_xyz");
    expect(agents).toEqual([]);
  });

  it("filing agent is available to care workers", () => {
    const agents = getAgentsForRole("residential_care_worker");
    const filingAgent = agents.find((a) => a.id === "filing_agent");
    expect(filingAgent).toBeDefined();
  });

  it("safeguarding agent is not available to care workers", () => {
    const agents = getAgentsForRole("residential_care_worker");
    const safeguardingAgent = agents.find((a) => a.id === "safeguarding_agent");
    expect(safeguardingAgent).toBeUndefined();
  });
});
