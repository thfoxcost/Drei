"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface UseCopyToClipboardOptions {
  timeout?: number
}

export function useCopyToClipboard({
  timeout = 1500,
}: UseCopyToClipboardOptions = {}) {
  const [isCopied, setIsCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const copyToClipboard = useCallback(
    async (text: string) => {
      if (!text) return false

      try {
        await navigator.clipboard.writeText(text)
        setIsCopied(true)

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
          setIsCopied(false)
        }, timeout)

        return true
      } catch (error) {
        console.error("Failed to copy:", error)
        return false
      }
    },
    [timeout]
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    isCopied,
    copyToClipboard,
  }
}