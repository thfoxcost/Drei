export async function getContributions() {
  const url = `${import.meta.env.VITE_BACKEND_URL}/api/contribution`

  console.log("Fetching:", url)

  const res = await fetch(url)

  console.log("Status:", res.status)
  console.log("Headers:", [...res.headers.entries()])

  const text = await res.text()

  console.log("Response:", text.slice(0, 200))

  const data = JSON.parse(text)

  return data.contributions
}