import { LockedFeatureScreen } from "../_components/locked-feature"

export default async function RefundsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return <LockedFeatureScreen title="Refunds" username={username} />
}
