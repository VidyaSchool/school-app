import { LockedFeatureScreen } from "../_components/locked-feature"

export default async function SettingsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return <LockedFeatureScreen title="Settings" username={username} />
}
