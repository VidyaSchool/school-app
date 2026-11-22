import { LockedFeatureScreen } from "../_components/locked-feature"

export default async function ExpensesPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return <LockedFeatureScreen title="Expenses" username={username} />
}
