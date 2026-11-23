import { LockedFeatureScreen } from "../_components/locked-feature"

export default async function IncomePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return <LockedFeatureScreen title="Income" username={username} />
}
