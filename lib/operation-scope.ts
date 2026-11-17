export type OperationScope = 'brasil' | 'sudeste' | 'sul'

const southeasternCities = new Set([
  'aracatuba', 'araraquara', 'barueri', 'belo horizonte', 'belford roxo', 'bocaiuva', 'bauru', 'campinas', 'campos dos goytacazes', 'cariacica', 'carapicuiba', 'contagem', 'diadema', 'duque de caxias', 'franca', 'governador valadares', 'guarulhos', 'ipatinga', 'itaborai', 'jacarei', 'jundiai', 'juiz de fora', 'macae', 'marilia', 'montes claros', 'niteroi', 'nova iguacu', 'osasco', 'petropolis', 'piracicaba', 'presidente prudente', 'ribeirao preto', 'rio de janeiro', 'santo andre', 'santos', 'sao bernardo do campo', 'sao caetano do sul', 'sao jose do rio preto', 'sao jose dos campos', 'sao paulo', 'serra', 'sorocaba', 'uberlândia', 'uberlandia', 'vila velha', 'vitoria',
])

const southernCities = new Set([
  'bento goncalves', 'blumenau', 'caxias do sul', 'chapeco', 'cascavel', 'curitiba', 'florianopolis', 'foz do iguacu', 'joinville', 'londrina', 'maringa', 'novo hamburgo', 'passo fundo', 'pelotas', 'ponta grossa', 'porto alegre', 'santa maria', 'sao jose', 'sao jose dos pinhais', 'itajai', 'criciuma', 'canoas',
])

function normalizeCity(city: string) {
  return city.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
}

export function filterByOperation<T extends { city: string }>(items: T[], operation: OperationScope): T[] {
  if (operation === 'brasil') return items
  const citySet = operation === 'sudeste' ? southeasternCities : southernCities
  return items.filter((item) => citySet.has(normalizeCity(item.city)))
}

export function operationLabel(operation: OperationScope) {
  if (operation === 'sudeste') return 'Operação Sudeste'
  if (operation === 'sul') return 'Operação Sul'
  return 'Operação Brasil'
}
