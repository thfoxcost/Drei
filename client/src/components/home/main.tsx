import { useEffect, useState } from "react"

import Clock from "@/components/clock-06"
import Dash from "./dash"
import Profile from "./profile"
import Weather from "./weather-07"
import SystemHealth from "./health"
import Repos from "./repos"

import { authClient } from "#/lib/auth-client"

interface Repo {
  name: string
  description: string
  tags: string[]
  language: string
  lastUpdated: string

  // dummy from backend for now
  stars: number
  forks: number
  license: string
}


function Main() {

  const { data: session } = authClient.useSession()

  const [repos, setRepos] = useState<Repo[]>([])

  const username = session?.user.name



  useEffect(() => {

    if (!username) return


    async function getRepos() {

      try {

        const res = await fetch(
          `http://localhost:3200/api/users/${username}/repos`
        )


        if (!res.ok) {
          throw new Error("Failed to fetch repos")
        }


        const data: Repo[] = await res.json()


        setRepos(data)


      } catch (err) {

        console.error(err)

      }

    }


    getRepos()


  }, [username])



  return (

    <div className="flex min-h-screen gap-6 p-6 overflow-hidden">


      <div className="flex flex-col gap-4">

        <Profile />


        <div
          className="
            flex h-26 w-auto items-center
            justify-center rounded-lg
            border border-dashed border-border
            text-sm text-muted-foreground
          "
        >

          @{username ?? "username"}

        </div>


      </div>




      <div className="flex flex-1 gap-6 min-w-0">


        <div className="flex-1 min-w-0">

          <Dash />


          <Repos repos={repos} />


        </div>




        <div className="flex flex-col gap-8.5 shrink-0">

          <Clock />

          <Weather />

          <SystemHealth />

        </div>


      </div>


    </div>

  )
}


export default Main