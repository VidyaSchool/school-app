import { LockedFeatureScreen } from "../_components/locked-feature"

export default async function ScholarshipsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return <LockedFeatureScreen title="Scholarships" username={username} />
}
