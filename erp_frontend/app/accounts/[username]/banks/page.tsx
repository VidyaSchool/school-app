import { LockedFeatureScreen } from "../_components/locked-feature"

export default async function BanksPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return <LockedFeatureScreen title="Bank Accounts" username={username} />
}
