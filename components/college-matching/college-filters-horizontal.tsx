import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Filter, X, ChevronDown, ChevronUp, Star } from "lucide-react"
import type { FilterState } from "./college-filters"
import { useIsMobile } from "@/hooks/use-mobile"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"

interface CollegeFiltersHorizontalProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  availableCountries: string[]
  totalColleges: number
  filteredCount: number
}

const SORT_OPTIONS = [
  { value: "matchScore", label: "Match Score (Highest)" },
  { value: "admissionChance", label: "Admission Chance (Highest)" },
  { value: "admissionChanceLow", label: "Admission Chance (Lowest)" },
  { value: "collegeName", label: "College Name (A-Z)" },
  { value: "acceptanceRate", label: "Acceptance Rate (Lowest)" },
  { value: "studentCount", label: "Student Population (Largest)" },
  { value: "annualCost", label: "Annual Cost (Lowest)" },
]

const FIT_CATEGORIES = [
  { value: "Safety", label: "Safety" },
  { value: "Target", label: "Target" },
  { value: "Reach", label: "Reach" },
]

export function CollegeFiltersHorizontal({
  filters,
  onFiltersChange,
  availableCountries,
  totalColleges,
  filteredCount,
  availableCampusSettings = [],
  availableCollegeSizes = [],
  availableInstitutionTypes = [],
}: any) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const isMobile = useIsMobile()
  const [expanded, setExpanded] = useState(false)

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      sortBy: "matchScore",
      admissionChanceRange: [0, 100],
      matchScoreRange: [0, 100],
      fitCategories: [],
      countries: [],
      campusSettings: [],
      collegeSizes: [],
      institutionTypes: [],
      acceptanceRateRange: [0, 100],
      annualCostRange: [0, 100000],
      hasFinancialAid: null,
      showDreamColleges: false,
    })
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.fitCategories.length > 0) count++
    if (filters.countries.length > 0) count++
    if (filters.campusSettings && filters.campusSettings.length > 0) count++
    if (filters.collegeSizes && filters.collegeSizes.length > 0) count++
    if (filters.institutionTypes && filters.institutionTypes.length > 0) count++
    if (filters.hasFinancialAid !== null) count++
    if (filters.admissionChanceRange[0] > 0 || filters.admissionChanceRange[1] < 100) count++
    if (filters.matchScoreRange[0] > 0 || filters.matchScoreRange[1] < 100) count++
    if (filters.acceptanceRateRange[0] > 0 || filters.acceptanceRateRange[1] < 100) count++
    if (filters.annualCostRange[0] > 0 || filters.annualCostRange[1] < 100000) count++
    if (filters.showDreamColleges) count++
    return count
  }

  // Checkbox group helper
  const renderCheckboxGroup = (options: { value: string; label: string }[], selected: string[], key: keyof FilterState) => (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <label key={opt.value} className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={selected.includes(opt.value)}
            onCheckedChange={checked => {
              if (checked) updateFilter(key, [...selected, opt.value])
              else updateFilter(key, selected.filter(v => v !== opt.value))
            }}
          />
          {opt.label}
        </label>
      ))}
    </div>
  )

  // Sliders
  const renderSlider = (value: [number, number], key: keyof FilterState, min: number, max: number, step: number, label: string, format: (v: number) => string) => (
    <div className="space-y-2 w-full bg-slate-50 rounded-xl p-4 shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-1">
        <Label className="text-base font-semibold text-slate-800">{label}</Label>
        <span className="text-xs font-medium text-blue-700 bg-blue-50 rounded px-2 py-0.5 ml-2">{format(value[0])} - {format(value[1])}</span>
      </div>
      <Slider
        value={value}
        onValueChange={v => updateFilter(key, v as [number, number])}
        min={min}
        max={max}
        step={step}
        className="w-full slider-elegant"
      />
    </div>
  )

  // Collapsed view: only Fit Categories and More Filters button
  const collapsedContent = (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gradient-to-r from-blue-50 via-slate-50 to-blue-100 rounded-2xl shadow-lg border border-slate-100">
      <div className="flex-1 flex flex-row justify-center gap-2">
        {FIT_CATEGORIES.map(cat => (
          <Button
            key={cat.value}
            size="sm"
            variant={filters.fitCategories.includes(cat.value) ? "default" : "outline"}
            className="rounded-full px-4 py-2 text-base font-semibold shadow-sm transition-colors duration-150 focus:ring-2 focus:ring-blue-300"
            onClick={() => {
              const newCats = filters.fitCategories.includes(cat.value)
                ? filters.fitCategories.filter(c => c !== cat.value)
                : [...filters.fitCategories, cat.value]
              updateFilter("fitCategories", newCats)
            }}
          >
            {cat.label}
          </Button>
        ))}
        {/* Dream College Filter */}
        <Button
          size="sm"
          variant={filters.showDreamColleges ? "default" : "outline"}
          className="rounded-full px-4 py-2 text-base font-semibold shadow-sm transition-colors duration-150 focus:ring-2 focus:ring-purple-300 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
          onClick={() => updateFilter("showDreamColleges", !filters.showDreamColleges)}
        >
          <Star className="h-4 w-4 mr-1" />
          Dream Colleges
        </Button>
      </div>
      <Button
        variant="default"
        size="lg"
        className="rounded-full px-6 py-2 font-medium text-sm shadow-md flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-400 text-white hover:from-blue-700 hover:to-blue-500 focus:ring-2 focus:ring-blue-300 transition-all"
        onClick={() => setExpanded(true)}
        aria-label="Show more filters"
      >
        <Filter className="h-5 w-5" />
        More Filters
      </Button>
    </div>
  )

  // Grouped filter content
  const groupedFilters = (
    <div className="flex flex-col gap-6">
      {/* Academic Fit */}
      <div>
        <div className="font-semibold text-slate-800 mb-2">Academic Fit</div>
        <div className="flex flex-col md:flex-row md:-mx-1">
          {renderSlider(filters.admissionChanceRange, "admissionChanceRange", 0, 100, 5, "Admission Chance Range", v => `${v}%`)}
          {renderSlider(filters.matchScoreRange, "matchScoreRange", 0, 100, 5, "Match Score Range", v => `${v}%`)}
        </div>
      </div>
      {/* Fit Categories + Cost & Financial side by side on desktop */}
      <div className="flex flex-col md:flex-row md:gap-6">
        {/* Fit Categories */}
        <div className="flex-1 mb-6 md:mb-0">
          <div className="font-semibold text-slate-800 mb-2">Fit Categories</div>
          <div className="flex gap-2">
            {FIT_CATEGORIES.map(cat => (
              <Button
                key={cat.value}
                size="sm"
                variant={filters.fitCategories.includes(cat.value) ? "default" : "outline"}
                className="rounded-full px-3"
                onClick={() => {
                  const newCats = filters.fitCategories.includes(cat.value)
                    ? filters.fitCategories.filter(c => c !== cat.value)
                    : [...filters.fitCategories, cat.value]
                  updateFilter("fitCategories", newCats)
                }}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
        {/* Cost & Financial */}
        <div className="flex-1 flex flex-col items-center md:items-center md:justify-center w-full">
          <div className="font-semibold text-slate-800 mb-2 text-center">Cost & Financial</div>
          <div className="flex flex-col md:flex-row md:justify-center md:items-center md:-mx-1 w-full">
            {renderSlider(filters.annualCostRange, "annualCostRange", 0, 100000, 5000, "Annual Cost Range", v => `$${v.toLocaleString()}`)}
          </div>
          <Label className="text-sm font-medium text-slate-700 mb-1 block mt-2 text-center">Financial Aid</Label>
          <div className="flex gap-4 justify-center">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={filters.hasFinancialAid === true}
                onCheckedChange={checked => updateFilter("hasFinancialAid", checked ? true : null)}
              />
              Available
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={filters.hasFinancialAid === false}
                onCheckedChange={checked => updateFilter("hasFinancialAid", checked ? false : null)}
              />
              Not Available
            </label>
          </div>
        </div>
      </div>
      {/* Location + Institution side by side on desktop */}
      <div className="flex flex-col md:flex-row md:gap-6">
        {/* Location */}
        <div className="flex-1 mb-6 md:mb-0">
          <div className="font-semibold text-slate-800 mb-2">Location</div>
          <Label className="text-sm font-medium text-slate-700 mb-1 block">Countries</Label>
          {renderCheckboxGroup(
            (availableCountries as string[]).map((c: string) => ({ value: c, label: c })),
            filters.countries,
            "countries"
          )}
          <Label className="text-sm font-medium text-slate-700 mb-1 block mt-2">Campus Setting</Label>
          {renderCheckboxGroup(
            (availableCampusSettings as string[]).map((c: string) => ({ value: c, label: c })),
            filters.campusSettings,
            "campusSettings"
          )}
        </div>
        {/* Institution */}
        <div className="flex-1">
          <div className="font-semibold text-slate-800 mb-2">Institution</div>
          <Label className="text-sm font-medium text-slate-700 mb-1 block">College Size</Label>
          {renderCheckboxGroup(
            (availableCollegeSizes as string[]).map((c: string) => ({ value: c, label: c })),
            filters.collegeSizes,
            "collegeSizes"
          )}
          <Label className="text-sm font-medium text-slate-700 mb-1 block mt-2">Institution Type</Label>
          {renderCheckboxGroup(
            (availableInstitutionTypes as string[]).map((c: string) => ({ value: c, label: c })),
            filters.institutionTypes,
            "institutionTypes"
          )}
          <div className="w-full mt-2">
            {renderSlider(filters.acceptanceRateRange, "acceptanceRateRange", 0, 100, 5, "Acceptance Rate Range", v => `${v}%`)}
          </div>
        </div>
      </div>
    </div>
  )

  // Mobile: collapsible groups
  const mobileMenuContent = (
    <Accordion type="multiple" className="w-full flex flex-col gap-2">
      <AccordionItem value="academic">
        <AccordionTrigger className="font-semibold text-slate-800">Academic Fit</AccordionTrigger>
        <AccordionContent>{groupedFilters.props.children[0]}</AccordionContent>
      </AccordionItem>
      <AccordionItem value="location">
        <AccordionTrigger className="font-semibold text-slate-800">Location</AccordionTrigger>
        <AccordionContent>{groupedFilters.props.children[1]}</AccordionContent>
      </AccordionItem>
      <AccordionItem value="institution">
        <AccordionTrigger className="font-semibold text-slate-800">Institution</AccordionTrigger>
        <AccordionContent>{groupedFilters.props.children[2]}</AccordionContent>
      </AccordionItem>
      <AccordionItem value="cost">
        <AccordionTrigger className="font-semibold text-slate-800">Cost & Financial</AccordionTrigger>
        <AccordionContent>{groupedFilters.props.children[3]}</AccordionContent>
      </AccordionItem>
    </Accordion>
  )

  // Mobile: inside bottom sheet, use expand/collapse logic
  const mobileCollapsedContent = (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 justify-center">
        {FIT_CATEGORIES.map(cat => (
          <Button
            key={cat.value}
            size="sm"
            variant={filters.fitCategories.includes(cat.value) ? "default" : "outline"}
            className="rounded-full px-3"
            onClick={() => {
              const newCats = filters.fitCategories.includes(cat.value)
                ? filters.fitCategories.filter(c => c !== cat.value)
                : [...filters.fitCategories, cat.value]
              updateFilter("fitCategories", newCats)
            }}
          >
            {cat.label}
          </Button>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="mx-auto flex items-center gap-1"
        onClick={() => setExpanded(true)}
        aria-label="Show more filters"
      >
        <Filter className="h-4 w-4" />
        More Filters
      </Button>
    </div>
  )

  if (isMobile) {
    return (
      <>
        {/* Floating button at bottom right */}
        {!showMobileMenu && (
          <button
            className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white rounded-full shadow-lg p-4 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={() => setShowMobileMenu(true)}
            aria-label="Show filters and sort"
          >
            <Filter className="h-5 w-5" />
            <span className="font-semibold">Filters</span>
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-2 bg-white text-blue-700 border-blue-200">
                {getActiveFilterCount()}
              </Badge>
            )}
          </button>
        )}
        {/* Bottom sheet card for menu */}
        {showMobileMenu && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30">
            <div className="bg-white rounded-t-2xl shadow-lg p-4 max-h-[80vh] overflow-y-auto animate-slide-up relative">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-slate-800 text-lg">Filter & Sort</span>
                <button
                  className="text-slate-500 hover:text-blue-600 transition-colors"
                  onClick={() => { setShowMobileMenu(false); setExpanded(false); }}
                  aria-label="Close"
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {!expanded ? (
                mobileCollapsedContent
              ) : (
                <>
                  {/* Collapse button at top right */}
                  <button
                    className="absolute top-4 right-4 text-slate-500 hover:text-blue-600 transition-colors"
                    onClick={() => setExpanded(false)}
                    aria-label="Collapse Filters"
                    title="Collapse Filters"
                  >
                    <ChevronUp className="h-5 w-5" />
                  </button>
                  {/* Fit Categories at top */}
                  <div className="mb-4">
                    <div className="font-semibold text-slate-800 mb-2">Fit Categories</div>
                    <div className="flex gap-2">
                      {FIT_CATEGORIES.map(cat => (
                        <Button
                          key={cat.value}
                          size="sm"
                          variant={filters.fitCategories.includes(cat.value) ? "default" : "outline"}
                          className="rounded-full px-3"
                          onClick={() => {
                            const newCats = filters.fitCategories.includes(cat.value)
                              ? filters.fitCategories.filter(c => c !== cat.value)
                              : [...filters.fitCategories, cat.value]
                            updateFilter("fitCategories", newCats)
                          }}
                        >
                          {cat.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {/* Academic Fit */}
                  <div className="mb-6">{groupedFilters.props.children[0]}</div>
                  {/* Location */}
                  <div className="mb-6">{groupedFilters.props.children[1]}</div>
                  {/* Institution */}
                  <div className="mb-6">{groupedFilters.props.children[2]}</div>
                  {/* Cost & Financial */}
                  <div className="mb-6">{groupedFilters.props.children[3]}</div>
                  {getActiveFilterCount() > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters} className="flex items-center gap-1 text-slate-500 w-full mt-4">
                      <X className="h-4 w-4" />
                      Clear All
                    </Button>
                  )}
                  <div className="text-xs text-slate-500 text-center mt-2">
                    Showing {filteredCount} of {totalColleges} colleges
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </>
    )
  }

  // Desktop sticky menu
  if (!isMobile) {
    return (
      <div className="sticky top-2 z-30 w-full mb-4">
        <div className="bg-white rounded-2xl shadow-lg border p-0 overflow-hidden relative">
          {/* Collapse button at top right */}
          {expanded && (
            <button
              className="absolute top-4 right-4 text-slate-500 hover:text-blue-600 transition-colors z-10"
              onClick={() => setExpanded(false)}
              aria-label="Collapse Filters"
              title="Collapse Filters"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
          )}
          {!expanded ? (
            collapsedContent
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50">
                {/* Fit Categories (top left) */}
                <div className="rounded-xl bg-white p-5 shadow-sm flex flex-col gap-4 border border-slate-100">
                  <div className="font-semibold text-slate-800 mb-1 text-lg">Fit Categories</div>
                  <div className="flex gap-2 mb-2">
                    {FIT_CATEGORIES.map(cat => (
                      <Button
                        key={cat.value}
                        size="sm"
                        variant={filters.fitCategories.includes(cat.value) ? "default" : "outline"}
                        className="rounded-full px-3"
                        onClick={() => {
                          const newCats = filters.fitCategories.includes(cat.value)
                            ? filters.fitCategories.filter(c => c !== cat.value)
                            : [...filters.fitCategories, cat.value]
                          updateFilter("fitCategories", newCats)
                        }}
                      >
                        {cat.label}
                      </Button>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 pt-4 mt-2">
                    <div className="font-semibold text-slate-800 mb-1 text-lg">Cost & Financial</div>
                    <div className="mb-2">
                      {renderSlider(filters.annualCostRange, "annualCostRange", 0, 100000, 5000, "Annual Cost Range", v => `$${v.toLocaleString()}`)}
                    </div>
                    <Label className="text-sm font-medium text-slate-700 mb-1 block">Financial Aid</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={filters.hasFinancialAid === true}
                          onCheckedChange={checked => updateFilter("hasFinancialAid", checked ? true : null)}
                        />
                        Available
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={filters.hasFinancialAid === false}
                          onCheckedChange={checked => updateFilter("hasFinancialAid", checked ? false : null)}
                        />
                        Not Available
                      </label>
                    </div>
                  </div>
                </div>
                {/* Academic Fit (top right) */}
                <div className="rounded-xl bg-white p-5 shadow-sm flex flex-col gap-4 border border-slate-100">
                  <div className="font-semibold text-slate-800 mb-1 text-lg">Academic Fit</div>
                  <div className="grid grid-cols-1 gap-4">
                    {renderSlider(filters.admissionChanceRange, "admissionChanceRange", 0, 100, 5, "Admission Chance Range", v => `${v}%`)}
                    {renderSlider(filters.matchScoreRange, "matchScoreRange", 0, 100, 5, "Match Score Range", v => `${v}%`)}
                  </div>
                </div>
                {/* Location */}
                <div className="rounded-xl bg-white p-5 shadow-sm flex flex-col gap-4 border border-slate-100">
                  <div className="font-semibold text-slate-800 mb-1 text-lg">Location</div>
                  <Label className="text-sm font-medium text-slate-700 mb-1 block">Countries</Label>
                  {renderCheckboxGroup(
                    (availableCountries as string[]).map((c: string) => ({ value: c, label: c })),
                    filters.countries,
                    "countries"
                  )}
                  <Label className="text-sm font-medium text-slate-700 mb-1 block mt-2">Campus Setting</Label>
                  {renderCheckboxGroup(
                    (availableCampusSettings as string[]).map((c: string) => ({ value: c, label: c })),
                    filters.campusSettings,
                    "campusSettings"
                  )}
                </div>
                {/* Institution */}
                <div className="rounded-xl bg-white p-5 shadow-sm flex flex-col gap-4 border border-slate-100">
                  <div className="font-semibold text-slate-800 mb-1 text-lg">Institution</div>
                  <Label className="text-sm font-medium text-slate-700 mb-1 block">College Size</Label>
                  {renderCheckboxGroup(
                    (availableCollegeSizes as string[]).map((c: string) => ({ value: c, label: c })),
                    filters.collegeSizes,
                    "collegeSizes"
                  )}
                  <Label className="text-sm font-medium text-slate-700 mb-1 block mt-2">Institution Type</Label>
                  {renderCheckboxGroup(
                    (availableInstitutionTypes as string[]).map((c: string) => ({ value: c, label: c })),
                    filters.institutionTypes,
                    "institutionTypes"
                  )}
                  <div className="w-full mt-2">
                    {renderSlider(filters.acceptanceRateRange, "acceptanceRateRange", 0, 100, 5, "Acceptance Rate Range", v => `${v}%`)}
                  </div>
                </div>
              </div>
              {/* Sticky footer for actions */}
              <div className="flex justify-between items-center gap-2 px-6 py-3 bg-slate-100 border-t border-slate-200 sticky bottom-0 z-20">
                {getActiveFilterCount() > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters} className="flex items-center gap-1 text-slate-500">
                    <X className="h-4 w-4" />
                    Clear All
                  </Button>
                )}
                <div className="text-xs text-slate-500 text-right ml-auto">
                  Showing {filteredCount} of {totalColleges} colleges
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }
} 