async function waitForLayout(ms = 800): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
  await new Promise((resolve) => setTimeout(resolve, ms))
}

function prepareElementForCapture(root: HTMLElement): void {
  root.querySelectorAll("[data-radix-scroll-area-viewport]").forEach((node) => {
    const viewport = node as HTMLElement
    const inner = viewport.firstElementChild as HTMLElement | null
    viewport.style.overflow = "visible"
    viewport.style.maxHeight = "none"
    viewport.style.height = "auto"
    if (inner) {
      viewport.style.width = `${inner.scrollWidth}px`
      viewport.style.minHeight = `${inner.scrollHeight}px`
    }
  })

  root.querySelectorAll<HTMLElement>(".overflow-hidden, [data-radix-scroll-area-root]").forEach((el) => {
    el.style.overflow = "visible"
  })

  root.querySelectorAll<HTMLElement>("[data-pdf-hide]").forEach((el) => {
    el.style.display = "none"
  })
}

function inlineComputedStyles(sourceRoot: HTMLElement, cloneRoot: HTMLElement): void {
  const sourceNodes = [sourceRoot, ...Array.from(sourceRoot.querySelectorAll<HTMLElement>("*"))]
  const cloneNodes = [cloneRoot, ...Array.from(cloneRoot.querySelectorAll<HTMLElement>("*"))]

  sourceNodes.forEach((source, index) => {
    const target = cloneNodes[index]
    if (!target) return

    const computed = window.getComputedStyle(source)
    const props = [
      "color",
      "background-color",
      "background-image",
      "border-color",
      "border-width",
      "border-style",
      "border-radius",
      "box-shadow",
      "font-family",
      "font-size",
      "font-weight",
      "line-height",
      "text-align",
      "padding",
      "margin",
      "display",
      "flex",
      "gap",
      "grid-template-columns",
      "width",
      "min-width",
      "height",
      "min-height",
      "opacity",
      "white-space",
    ]

    for (const prop of props) {
      const value = computed.getPropertyValue(prop)
      if (value) target.style.setProperty(prop, value)
    }

    target.style.overflow = "visible"
  })
}

function addCanvasAsPages(
  pdf: import("jspdf").jsPDF,
  canvas: HTMLCanvasElement,
  marginMm: number
): void {
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const contentWidth = pageWidth - marginMm * 2
  const contentHeight = pageHeight - marginMm * 2
  const pxPerMm = canvas.width / contentWidth
  const pageHeightPx = contentHeight * pxPerMm

  let offsetY = 0
  let pageIndex = 0

  while (offsetY < canvas.height) {
    const sliceHeight = Math.min(pageHeightPx, canvas.height - offsetY)
    const pageCanvas = document.createElement("canvas")
    pageCanvas.width = canvas.width
    pageCanvas.height = sliceHeight

    const ctx = pageCanvas.getContext("2d")
    if (!ctx) break

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
    ctx.drawImage(
      canvas,
      0,
      offsetY,
      canvas.width,
      sliceHeight,
      0,
      0,
      canvas.width,
      sliceHeight
    )

    const imgData = pageCanvas.toDataURL("image/jpeg", 0.95)
    const sliceHeightMm = sliceHeight / pxPerMm

    if (pageIndex > 0) pdf.addPage()
    pdf.addImage(imgData, "JPEG", marginMm, marginMm, contentWidth, sliceHeightMm)

    offsetY += sliceHeight
    pageIndex += 1
  }
}

export async function downloadPlaybookSummaryPdf({
  element,
  studentName,
  sessionNumber,
}: {
  element: HTMLElement
  studentName: string
  sessionNumber?: number
}): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ])

  prepareElementForCapture(element)
  await waitForLayout(100)

  const width = element.scrollWidth
  const height = element.scrollHeight

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    width,
    height,
    windowWidth: width,
    windowHeight: height,
    scrollX: 0,
    scrollY: 0,
    onclone: (_doc, clonedEl) => {
      const clone = clonedEl as HTMLElement
      prepareElementForCapture(clone)
      inlineComputedStyles(element, clone)
    },
  })

  if (!canvas.width || !canvas.height) {
    throw new Error("PDF capture produced an empty canvas")
  }

  const safeName =
    studentName
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase() || "student"
  const filename = `priority-playbook-${safeName}${
    sessionNumber ? `-session-${sessionNumber}` : ""
  }.pdf`

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" })
  addCanvasAsPages(pdf, canvas, 10)
  pdf.save(filename)
}

export { waitForLayout }
