export const DOCUMENT_TYPES = {
  PROJECT_PL: 'project_pl',
  PROJECT_CLAIM: 'project_claim',
  PROJECT_PROPOSAL: 'project_proposal',
  BRIEFING_DECK: 'briefing_deck'
} as const;

export type DocumentType = typeof DOCUMENT_TYPES[keyof typeof DOCUMENT_TYPES];
