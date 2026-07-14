export async function getContributions() {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/api/contribution`
  )

  if (!res.ok) {
    return []
  }

  const data = await res.json()

  return data.contributions
}