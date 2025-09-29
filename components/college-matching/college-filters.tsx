"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Filter,
  X,
  SlidersHorizontal,
  MapPin,
  GraduationCap,
  DollarSign,
  Users,
  Target,
  TrendingUp,
  Building2,
  Globe,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

export interface FilterState {
  // Sort options
  sortBy: string
  
  // Academic filters
  admissionChanceRange: [number, number]
  matchScoreRange: [number, number]
  fitCategories: string[]
  
  // Geographic filters
  countries: string[]
  campusSettings: string[]
  
  // Institutional filters
  collegeSizes: string[]
  institutionTypes: string[]
  acceptanceRateRange: [number, number]
  
  // Cost filters
  annualCostRange: [number, number]
  hasFinancialAid: boolean | null
  
  // Dream college filter
  showDreamColleges: boolean
}

export interface CollegeFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  availableCountries: string[]
  availableCampusSettings: string[]
  availableCollegeSizes: string[]
  availableInstitutionTypes: string[]
  totalColleges: number
  filteredCount: number
}

const SORT_OPTIONS = [
  { value: "matchScore", label: "Match Score (Highest)", icon: Target },
  { value: "admissionChance", label: "Admission Chance (Highest)", icon: TrendingUp },
  { value: "admissionChanceLow", label: "Admission Chance (Lowest)", icon: TrendingUp },
  { value: "collegeName", label: "College Name (A-Z)", icon: Building2 },
  { value: "acceptanceRate", label: "Acceptance Rate (Lowest)", icon: GraduationCap },
  { value: "studentCount", label: "Student Population (Largest)", icon: Users },
  { value: "annualCost", label: "Annual Cost (Lowest)", icon: DollarSign },
]

const FIT_CATEGORIES = [
  { value: "Safety", label: "Safety", color: "bg-green-100 text-green-800" },
  { value: "Target", label: "Target", color: "bg-blue-100 text-blue-800" },
  { value: "Reach", label: "Reach", color: "bg-orange-100 text-orange-800" },
]

export const CAMPUS_SETTINGS = [
  { value: "Urban", label: "Urban" },
  { value: "Suburban", label: "Suburban" },
  { value: "Rural", label: "Rural" },
]

export const COLLEGE_SIZES = [
  { value: "Small", label: "Small (<2,000 students)" },
  { value: "Medium", label: "Medium (2,000-15,000)" },
  { value: "Large", label: "Large (>15,000 students)" },
]

export const INSTITUTION_TYPES = [
  { value: "Public Research University", label: "Public Research" },
  { value: "Private Research University", label: "Private Research" },
  { value: "Liberal Arts College", label: "Liberal Arts" },
  { value: "Public University", label: "Public University" },
  { value: "Private University", label: "Private University" },
]

export function CollegeFilters({
  filters,
  onFiltersChange,
  availableCountries,
  availableCampusSettings,
  availableCollegeSizes,
  availableInstitutionTypes,
  totalColleges,
  filteredCount,
}: CollegeFiltersProps) {
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

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
    if (filters.campusSettings.length > 0) count++
    if (filters.collegeSizes.length > 0) count++
    if (filters.institutionTypes.length > 0) count++
    if (filters.hasFinancialAid !== null) count++
    if (filters.admissionChanceRange[0] > 0 || filters.admissionChanceRange[1] < 100) count++
    if (filters.matchScoreRange[0] > 0 || filters.matchScoreRange[1] < 100) count++
    if (filters.acceptanceRateRange[0] > 0 || filters.acceptanceRateRange[1] < 100) count++
    if (filters.annualCostRange[0] > 0 || filters.annualCostRange[1] < 100000) count++
    if (filters.showDreamColleges) count++
    return count
  }

  const renderFilterSection = (title: string, section: string, children: React.ReactNode) => (
    <div className="border-b border-slate-200 last:border-b-0">
      <button
        onClick={() => toggleSection(section)}
        className="flex items-center justify-between w-full p-4 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="font-medium text-slate-800">{title}</span>
        {expandedSections.has(section) ? (
          <ChevronUp className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        )}
      </button>
      {expandedSections.has(section) && (
        <div className="px-4 pb-4 space-y-3">
          {children}
        </div>
      )}
    </div>
  )

  const renderCheckboxGroup = (
    options: { value: string; label: string; color?: string }[],
    selectedValues: string[],
    onChange: (values: string[]) => void
  ) => (
    <div className="space-y-2">
      {options.map((option) => (
        <div key={option.value} className="flex items-center space-x-2">
          <Checkbox
            id={option.value}
            checked={selectedValues.includes(option.value)}
            onCheckedChange={(checked) => {
              if (checked) {
                onChange([...selectedValues, option.value])
              } else {
                onChange(selectedValues.filter(v => v !== option.value))
              }
            }}
          />
          <Label
            htmlFor={option.value}
            className="text-sm font-normal cursor-pointer flex items-center gap-2"
          >
            {option.color ? (
              <Badge className={`text-xs ${option.color}`}>
                {option.label}
              </Badge>
            ) : (
              option.label
            )}
          </Label>
        </div>
      ))}
    </div>
  )

  const renderRangeSlider = (
    range: [number, number],
    onChange: (range: [number, number]) => void,
    min: number,
    max: number,
    step: number,
    formatValue: (value: number) => string
  ) => (
    <div className="space-y-3">
      <div className="flex justify-between text-sm text-slate-600">
        <span>{formatValue(range[0])}</span>
        <span>{formatValue(range[1])}</span>
      </div>
      <Slider
        value={range}
        onValueChange={onChange}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
    </div>
  )

  const filterContent = (
    <div className="space-y-6">
      {/* Sort Options */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-700">Sort by</Label>
        <Select value={filters.sortBy} onValueChange={(value) => updateFilter("sortBy", value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <option.icon className="h-4 w-4" />
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Academic Fit */}
      {renderFilterSection("Academic Fit", "academic", (
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2 block">
              Admission Chance Range
            </Label>
            {renderRangeSlider(
              filters.admissionChanceRange,
              (range) => updateFilter("admissionChanceRange", range),
              0, 100, 5,
              (value) => `${value}%`
            )}
          </div>
          
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2 block">
              Match Score Range
            </Label>
            {renderRangeSlider(
              filters.matchScoreRange,
              (range) => updateFilter("matchScoreRange", range),
              0, 100, 5,
              (value) => `${value}%`
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2 block">
              Fit Categories
            </Label>
            {renderCheckboxGroup(
              FIT_CATEGORIES,
              filters.fitCategories,
              (values) => updateFilter("fitCategories", values)
            )}
          </div>
        </div>
      ))}

      {/* Dream Colleges */}
      {renderFilterSection("Dream Colleges", "dream", (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showDreamColleges"
              checked={filters.showDreamColleges}
              onCheckedChange={(checked) => updateFilter("showDreamColleges", checked)}
            />
            <Label htmlFor="showDreamColleges" className="text-sm font-medium text-slate-700">
              Show Only Dream Colleges
            </Label>
          </div>
          <p className="text-xs text-slate-500">
            Filter to show only colleges you've selected as dream colleges in your profile
          </p>
        </div>
      ))}

      {/* Geographic */}
      {renderFilterSection("Location", "geographic", (
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2 block">
              Countries
            </Label>
            {renderCheckboxGroup(
              availableCountries.map(country => ({ value: country, label: country })),
              filters.countries,
              (values) => updateFilter("countries", values)
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2 block">
              Campus Setting
            </Label>
            {renderCheckboxGroup(
              CAMPUS_SETTINGS,
              filters.campusSettings,
              (values) => updateFilter("campusSettings", values)
            )}
          </div>
        </div>
      ))}

      {/* Institutional */}
      {renderFilterSection("Institution", "institutional", (
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2 block">
              College Size
            </Label>
            {renderCheckboxGroup(
              COLLEGE_SIZES,
              filters.collegeSizes,
              (values) => updateFilter("collegeSizes", values)
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2 block">
              Institution Type
            </Label>
            {renderCheckboxGroup(
              INSTITUTION_TYPES,
              filters.institutionTypes,
              (values) => updateFilter("institutionTypes", values)
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2 block">
              Acceptance Rate Range
            </Label>
            {renderRangeSlider(
              filters.acceptanceRateRange,
              (range) => updateFilter("acceptanceRateRange", range),
              0, 100, 5,
              (value) => `${value}%`
            )}
          </div>
        </div>
      ))}

      {/* Cost */}
      {renderFilterSection("Cost & Financial", "cost", (
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2 block">
              Annual Cost Range
            </Label>
            {renderRangeSlider(
              filters.annualCostRange,
              (range) => updateFilter("annualCostRange", range),
              0, 100000, 5000,
              (value) => `$${value.toLocaleString()}`
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2 block">
              Financial Aid
            </Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="financialAid-yes"
                  checked={filters.hasFinancialAid === true}
                  onCheckedChange={(checked) => updateFilter("hasFinancialAid", checked ? true : null)}
                />
                <Label htmlFor="financialAid-yes" className="text-sm">Available</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="financialAid-no"
                  checked={filters.hasFinancialAid === false}
                  onCheckedChange={(checked) => updateFilter("hasFinancialAid", checked ? false : null)}
                />
                <Label htmlFor="financialAid-no" className="text-sm">Not Available</Label>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Clear Filters */}
      {getActiveFilterCount() > 0 && (
        <div className="pt-4 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={clearAllFilters}
            className="w-full"
          >
            <X className="h-4 w-4 mr-2" />
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  )

  // Mobile Filter Trigger
  if (isMobile) {
    return (
      <>
        {/* Mobile Filter Button */}
        <div className="flex items-center justify-between mb-4 p-4 bg-white rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-slate-600" />
            <span className="font-medium text-slate-800">Filters</span>
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFilterCount()}
              </Badge>
            )}
          </div>
          <div className="text-sm text-slate-600">
            {filteredCount} of {totalColleges} colleges
          </div>
        </div>

        {/* Mobile Filter Drawer */}
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger asChild>
            <Button
              variant="outline"
              className="w-full mb-4"
              onClick={() => setIsOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filter & Sort Colleges
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="flex items-center justify-between">
                <span>Filter & Sort</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-8 max-h-[70vh] overflow-y-auto">
              {filterContent}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    )
  }

  // Desktop Sidebar
  return (
    <div className="w-80 bg-white rounded-lg shadow-sm border p-6 h-fit sticky top-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800">Filter & Sort</h3>
        {getActiveFilterCount() > 0 && (
          <Badge variant="secondary">
            {getActiveFilterCount()}
          </Badge>
        )}
      </div>
      
      <div className="text-sm text-slate-600 mb-6">
        Showing {filteredCount} of {totalColleges} colleges
      </div>

      {filterContent}
    </div>
  )
} 