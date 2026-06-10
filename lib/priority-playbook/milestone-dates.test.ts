import assert from "node:assert/strict"
import {
  formatMilestoneButtonDate,
  formatMilestoneDisplayDate,
  formatMilestoneRangeLabel,
  normalizeMilestoneDateRange,
  parseMilestoneDate,
  toMilestoneDateString,
} from "./milestone-dates"

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`✓ ${name}`)
  } catch (error) {
    console.error(`✗ ${name}`)
    throw error
  }
}

test("parseMilestoneDate reads YYYY-MM-DD as local date", () => {
  const date = parseMilestoneDate("2026-06-08")
  assert.ok(date)
  assert.equal(date.getFullYear(), 2026)
  assert.equal(date.getMonth(), 5)
  assert.equal(date.getDate(), 8)
})

test("toMilestoneDateString round-trips", () => {
  const date = new Date(2026, 5, 8)
  assert.equal(toMilestoneDateString(date), "2026-06-08")
})

test("formatMilestoneButtonDate uses compact label", () => {
  assert.equal(formatMilestoneButtonDate("2026-06-08"), "Jun 8, 2026")
  assert.equal(formatMilestoneButtonDate(""), "Pick a date")
})

test("formatMilestoneDisplayDate matches button format", () => {
  assert.equal(formatMilestoneDisplayDate("2026-12-25"), "Dec 25, 2026")
})

test("parseMilestoneDate rejects invalid values", () => {
  assert.equal(parseMilestoneDate(undefined), undefined)
  assert.equal(parseMilestoneDate("not-a-date"), undefined)
  assert.equal(parseMilestoneDate("2026-13-40"), undefined)
})

test("formatMilestoneRangeLabel handles start, end, and ranges", () => {
  assert.equal(formatMilestoneRangeLabel("2026-06-01", "2026-06-08"), "Jun 1, 2026 – Jun 8, 2026")
  assert.equal(formatMilestoneRangeLabel("2026-06-01", ""), "from Jun 1, 2026")
  assert.equal(formatMilestoneRangeLabel("", "2026-06-08"), "by Jun 8, 2026")
  assert.equal(formatMilestoneRangeLabel("", ""), "")
})

test("normalizeMilestoneDateRange swaps reversed dates", () => {
  assert.deepEqual(
    normalizeMilestoneDateRange("2026-06-08", "2026-06-01"),
    { startDate: "2026-06-01", endDate: "2026-06-08" }
  )
})

console.log("\nAll milestone date tests passed.")
