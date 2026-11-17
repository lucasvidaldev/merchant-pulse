import { AppShell } from '@/components/merchant-pulse/shell'
import { MerchantDetail } from '@/components/merchant-pulse/merchant-detail'

export default async function RestaurantDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AppShell><MerchantDetail id={id} /></AppShell>
}
