import { LockedFeatureScreen } from "../_components/locked-feature"

export default async function InvoicesPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return <LockedFeatureScreen title="Invoices" username={username} />
}
