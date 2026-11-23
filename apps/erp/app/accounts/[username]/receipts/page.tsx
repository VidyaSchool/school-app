import { LockedFeatureScreen } from "../_components/locked-feature"

export default async function ReceiptsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return <LockedFeatureScreen title="Receipts" username={username} />
}
