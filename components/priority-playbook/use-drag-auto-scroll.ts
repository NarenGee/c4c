"use client"

import { useEffect } from "react"

const EDGE_MARGIN = 80
const SCROLL_SPEED = 14

export function useDragAutoScroll(isDragging: boolean) {
  useEffect(() => {
    if (!isDragging) return

    const handleDragOver = (event: DragEvent) => {
      if (event.clientY < EDGE_MARGIN) {
        window.scrollBy(0, -SCROLL_SPEED)
      } else if (event.clientY > window.innerHeight - EDGE_MARGIN) {
        window.scrollBy(0, SCROLL_SPEED)
      }
    }

    document.addEventListener("dragover", handleDragOver)
    return () => document.removeEventListener("dragover", handleDragOver)
  }, [isDragging])
}
