import { redirect } from "next/navigation"

export default async function TasksPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  redirect(`/teacher/${username}/tasks/new`)
}
