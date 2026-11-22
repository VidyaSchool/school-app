import { LockedFeatureScreen } from "../_components/locked-feature"

export default async function PayrollPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return <LockedFeatureScreen title="Payroll" username={username} />
}
