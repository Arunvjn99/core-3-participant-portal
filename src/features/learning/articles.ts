export type Topic = 'basics' | 'taxes' | 'investing' | 'retirement'

export interface Article {
  id: string
  topic: Topic
  minutes: number
}

export const TOPICS: Topic[] = ['basics', 'taxes', 'investing', 'retirement']

export const ARTICLES: Article[] = [
  { id: 'understanding_401k', topic: 'basics', minutes: 5 },
  { id: 'pretax_vs_roth', topic: 'taxes', minutes: 4 },
  { id: 'investing_basics', topic: 'investing', minutes: 6 },
  { id: 'planning', topic: 'retirement', minutes: 7 },
  { id: 'enrolling', topic: 'basics', minutes: 3 },
  { id: 'sources', topic: 'taxes', minutes: 3 },
  { id: 'match', topic: 'basics', minutes: 3 },
  { id: 'first_election', topic: 'investing', minutes: 3 },
]

/** The featured "getting started" path, in order. */
export const FEATURED_PATH = ['enrolling', 'sources', 'match', 'first_election']
