// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence — Evidence Engine
//
// Semantic search, embedding, and retrieval across all Cara records.
// Uses Voyage AI for embeddings, Cohere for reranking.
// Powers evidence packs, compliance matching, and filing cabinet search.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  CaraEvidenceQuery,
  CaraEvidenceResult,
  CaraRole,
} from "../core/types";
import { getProvider } from "../providers";
import { redactSensitiveData } from "../safety/data-protection";
import type { ProviderEmbeddingResponse, ProviderRerankResponse } from "../providers/base-provider";

// ── Evidence Source Types ──────────────────────────────────────────────────

export const EVIDENCE_SOURCE_TYPES = [
  "daily_log",
  "incident",
  "sanction",
  "reward",
  "keywork_session",
  "missing_from_care",
  "health_record",
  "education_record",
  "contact_record",
  "complaint",
  "compliment",
  "staff_supervision",
  "team_meeting",
  "reg45_report",
  "annex_a_report",
  "rag44_evidence",
  "risk_assessment",
  "placement_plan",
  "care_plan",
  "behaviour_support_plan",
  "safeguarding_record",
  "policy",
  "procedure",
  "audit",
] as const;

export type EvidenceSourceType = typeof EVIDENCE_SOURCE_TYPES[number];

// ── CaraEvidenceEngine ────────────────────────────────────────────────────

export class CaraEvidenceEngine {
  private embeddingIndex: EvidenceEmbedding[] = [];

  /**
   * Index a document for semantic search.
   */
  async indexDocument(doc: {
    id: string;
    title: string;
    content: string;
    sourceType: EvidenceSourceType;
    date: string;
    organisationId: string;
    homeId?: string;
    childId?: string;
    staffId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const voyageProvider = getProvider("voyage");
    if (!voyageProvider.isAvailable()) {
      // Fallback: store without embedding for keyword search
      this.embeddingIndex.push({
        id: doc.id,
        title: doc.title,
        content: doc.content.slice(0, 2000), // store summary only
        sourceType: doc.sourceType,
        date: doc.date,
        organisationId: doc.organisationId,
        homeId: doc.homeId,
        childId: doc.childId,
        staffId: doc.staffId,
        embedding: [],
        metadata: doc.metadata ?? {},
      });
      return;
    }

    // Generate embedding
    const response: ProviderEmbeddingResponse = await voyageProvider.embed({
      texts: [this.prepareForEmbedding(doc.title, doc.content)],
    });

    this.embeddingIndex.push({
      id: doc.id,
      title: doc.title,
      content: doc.content.slice(0, 2000),
      sourceType: doc.sourceType,
      date: doc.date,
      organisationId: doc.organisationId,
      homeId: doc.homeId,
      childId: doc.childId,
      staffId: doc.staffId,
      embedding: response.embeddings[0] ?? [],
      metadata: doc.metadata ?? {},
    });
  }

  /**
   * Search the evidence index semantically.
   */
  async search(query: CaraEvidenceQuery): Promise<CaraEvidenceResult[]> {
    // Filter by permissions
    let candidates = this.filterByPermissions(query);

    // Apply source type filter
    if (query.sourceTypes?.length) {
      candidates = candidates.filter(c => query.sourceTypes!.includes(c.sourceType));
    }

    // Apply date filter
    if (query.dateFrom) {
      candidates = candidates.filter(c => c.date >= query.dateFrom!);
    }
    if (query.dateTo) {
      candidates = candidates.filter(c => c.date <= query.dateTo!);
    }

    // Filter by child/home/staff
    if (query.childId) {
      candidates = candidates.filter(c => c.childId === query.childId);
    }
    if (query.homeId) {
      candidates = candidates.filter(c => c.homeId === query.homeId || !c.homeId);
    }

    if (candidates.length === 0) {
      return [];
    }

    // Try semantic search with Voyage
    const voyageProvider = getProvider("voyage");
    let rankedResults: { index: number; score: number }[] = [];

    if (voyageProvider.isAvailable() && candidates.some(c => c.embedding.length > 0)) {
      // Embed query — redact PII before it leaves for the external provider.
      const queryEmb = await voyageProvider.embed({ texts: [redactSensitiveData(query.query).redactedText] });
      const queryVector = queryEmb.embeddings[0];

      // Cosine similarity
      rankedResults = candidates
        .map((c, idx) => ({
          index: idx,
          score: c.embedding.length > 0 ? cosineSimilarity(queryVector, c.embedding) : 0,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, (query.limit ?? 10) * 2); // Get 2x for reranking
    } else {
      // Fallback: keyword match
      rankedResults = candidates
        .map((c, idx) => ({
          index: idx,
          score: keywordScore(query.query, c.title + " " + c.content),
        }))
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, (query.limit ?? 10) * 2);
    }

    // Rerank with Cohere if available
    const cohereProvider = getProvider("cohere");
    if (cohereProvider.isAvailable() && rankedResults.length > 3) {
      try {
        // Redact PII before documents + query leave for the external reranker.
        const documents = rankedResults.map(r =>
          redactSensitiveData(candidates[r.index].title + ": " + candidates[r.index].content.slice(0, 500)).redactedText,
        );
        const rerankResponse: ProviderRerankResponse = await cohereProvider.rerank({
          query: redactSensitiveData(query.query).redactedText,
          documents,
          topK: query.limit ?? 10,
        });

        rankedResults = rerankResponse.results.map(r => ({
          index: rankedResults[r.index].index,
          score: r.relevanceScore,
        }));
      } catch {
        // Fallback to original ranking
        rankedResults = rankedResults.slice(0, query.limit ?? 10);
      }
    } else {
      rankedResults = rankedResults.slice(0, query.limit ?? 10);
    }

    // Build results
    return rankedResults.map(r => {
      const doc = candidates[r.index];
      return {
        id: doc.id,
        documentTitle: doc.title,
        sourceType: doc.sourceType,
        date: doc.date,
        childId: doc.childId,
        homeId: doc.homeId,
        staffId: doc.staffId,
        relevanceScore: Math.round(r.score * 100) / 100,
        summary: doc.content.slice(0, 200),
        excerpt: doc.content.slice(0, 500),
        permissionCheck: true,
        canUseInReporting: this.canUseInReporting(doc.sourceType, query.userRole),
        metadata: doc.metadata,
      };
    });
  }

  /**
   * Get index size for monitoring.
   */
  getIndexSize(): number {
    return this.embeddingIndex.length;
  }

  // ── Private Methods ─────────────────────────────────────────────────────

  private prepareForEmbedding(title: string, content: string): string {
    // Combine title and content, truncate for embedding limits. Redact PII
    // FIRST — the embedding provider (Voyage) is external and not on the AI
    // gateway's approved-provider register, so no child-identifying data leaves
    // the system for indexing.
    const combined = `${title}\n\n${content}`.slice(0, 8000);
    return redactSensitiveData(combined).redactedText;
  }

  private filterByPermissions(query: CaraEvidenceQuery): EvidenceEmbedding[] {
    return this.embeddingIndex.filter(doc => {
      // Must be same organisation
      if (doc.organisationId !== query.organisationId) return false;

      // External professionals and inspectors only see certain types
      if (query.userRole === "external_professional" || query.userRole === "inspector_readonly") {
        const allowedTypes: EvidenceSourceType[] = [
          "reg45_report", "annex_a_report", "policy", "procedure",
        ];
        return allowedTypes.includes(doc.sourceType);
      }

      // Support workers can only see records for their home
      if (query.userRole === "support_worker" && query.homeId) {
        return doc.homeId === query.homeId;
      }

      return true;
    });
  }

  private canUseInReporting(sourceType: EvidenceSourceType, role: CaraRole): boolean {
    // Only certain source types can be cited in official reporting
    const reportableSources: EvidenceSourceType[] = [
      "daily_log", "incident", "keywork_session", "health_record",
      "education_record", "contact_record", "risk_assessment",
      "reg45_report", "care_plan", "placement_plan",
    ];

    // Only management roles can use evidence in official reports
    const reportingRoles: CaraRole[] = [
      "deputy_manager", "registered_manager", "responsible_individual",
      "operations_manager", "director",
    ];

    return reportableSources.includes(sourceType) && reportingRoles.includes(role);
  }
}

// ── Types ─────────────────────────────────────────────────────────────────

interface EvidenceEmbedding {
  id: string;
  title: string;
  content: string;
  sourceType: EvidenceSourceType;
  date: string;
  organisationId: string;
  homeId?: string;
  childId?: string;
  staffId?: string;
  embedding: number[];
  metadata: Record<string, unknown>;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

function keywordScore(query: string, text: string): number {
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const lowerText = text.toLowerCase();
  let matches = 0;
  for (const word of words) {
    if (lowerText.includes(word)) matches++;
  }
  return words.length > 0 ? matches / words.length : 0;
}

// Singleton
export const caraEvidenceEngine = new CaraEvidenceEngine();
