export type ScenarioType = 'navigation' | 'action' | 'ai'

export interface SearchScenario {
  id: string
  keywords: string[]
  queries: string[]
  type: ScenarioType
  subtitle?: string
  route?: string
  action?: string
  quickAnswer?: string
}
