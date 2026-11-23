import { LockedFeatureScreen } from "../_components/locked-feature"

export default async function PaymentsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return <LockedFeatureScreen title="Payments" username={username} />
}
