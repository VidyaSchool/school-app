import { LockedFeatureScreen } from "../_components/locked-feature"

export default async function ReportsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return <LockedFeatureScreen title="Reports" username={username} />
}
