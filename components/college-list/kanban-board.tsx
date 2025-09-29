"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Filter, Search, X, ChevronDown, ChevronUp } from "lucide-react"
import { getMyCollegeList, moveCollegeToStage, type CollegeListItem } from "@/app/actions/college-list"
import { CollegeCard } from "./college-card"
import { AddCollegeDialog } from "./add-college-dialog"
import { CollegeFiltersHorizontal } from "@/components/college-matching/college-filters-horizontal"
import type { FilterState } from "@/components/college-matching/college-filters"
import { CAMPUS_SETTINGS, COLLEGE_SIZES } from "@/components/college-matching/college-filters"

interface KanbanBoardProps {
  refreshTrigger?: number
}

const KANBAN_STAGES = [
  { key: 'Considering', label: 'Considering', color: 'bg-blue-50', border: 'border-blue-100' },
  { key: 'Planning to Apply', label: 'Planning to Apply', color: 'bg-blue-100', border: 'border-blue-200' },
  { key: 'Applied', label: 'Applied', color: 'bg-blue-200', border: 'border-blue-300' },
  { key: 'Interviewing', label: 'Interviewing', color: 'bg-blue-300', border: 'border-blue-400' },
  { key: 'Accepted', label: 'Accepted', color: 'bg-green-100', border: 'border-green-300' },
  { key: 'Rejected', label: 'Rejected', color: 'bg-red-100', border: 'border-red-300' },
  { key: 'Enrolled', label: 'Enrolled', color: 'bg-blue-500', border: 'border-blue-700', text: 'text-white' },
] as const

export function KanbanBoard({ refreshTrigger }: KanbanBoardProps) {
  // All hooks must be at the top
  const topScrollRef = useRef<HTMLDivElement>(null)
  const mainScrollRef = useRef<HTMLDivElement>(null)
  const [colleges, setColleges] = useState<CollegeListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedCollege, setDraggedCollege] = useState<CollegeListItem | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedStage, setSelectedStage] = useState<CollegeListItem['application_status']>('Considering')
  const [searchTerm, setSearchTerm] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<FilterState>({
    sortBy: "collegeName",
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
  })

  const loadColleges = async () => {
    try {
      const result = await getMyCollegeList()
      if (result.success && result.data) {
        setColleges(result.data.sort((a, b) => (a.stage_order || 0) - (b.stage_order || 0)))
      }
    } catch (error) {
      console.error("Failed to load colleges:", error)
      setMessage({ type: "error", text: "Failed to load your college list" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadColleges()
  }, [refreshTrigger])

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const handleDragStart = (e: React.DragEvent, college: CollegeListItem) => {
    setDraggedCollege(college)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverStage(stage)
  }

  const handleDragLeave = () => {
    setDragOverStage(null)
  }

  const handleDrop = async (e: React.DragEvent, newStage: CollegeListItem['application_status']) => {
    e.preventDefault()
    setDragOverStage(null)

    if (!draggedCollege || draggedCollege.application_status === newStage) {
      setDraggedCollege(null)
      return
    }

    try {
      const result = await moveCollegeToStage(draggedCollege.id, newStage)
      if (result.success) {
        await loadColleges()
        setMessage({ type: "success", text: `${draggedCollege.college_name} moved to ${newStage}` })
      } else {
        setMessage({ type: "error", text: result.error || "Failed to move college" })
      }
    } catch (error) {
      console.error("Failed to move college:", error)
      setMessage({ type: "error", text: "Failed to move college" })
    }

    setDraggedCollege(null)
  }

  const handleCollegeUpdate = () => {
    loadColleges()
  }

  const handleAddCollege = (stage: CollegeListItem['application_status']) => {
    setSelectedStage(stage)
    setShowAddDialog(true)
  }

  const toggleStageExpansion = (stage: string) => {
    setExpandedStages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(stage)) {
        newSet.delete(stage)
      } else {
        newSet.add(stage)
      }
      return newSet
    })
  }

  // Extract available filter options from the loaded colleges
  const availableCountries = Array.from(new Set(colleges.map((c: CollegeListItem) => (c.college_location?.split(", ").pop() ?? "")).filter(Boolean))).sort()
  const availableCollegeTypes = Array.from(new Set(colleges.map((c: CollegeListItem) => c.college_type ?? "").filter(Boolean))).sort()

  // Filtering logic for the Kanban board
  const filteredColleges = colleges.filter((college: CollegeListItem) => {
    // Search term
    const matchesSearch = college.college_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (college.college_location?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    // Country filter
    const matchesCountry = filters.countries.length === 0 || (college.college_location && filters.countries.some(country => (college.college_location ?? "").includes(country)))
    // Type filter
    const matchesType = filters.institutionTypes.length === 0 || (college.college_type && filters.institutionTypes.includes(college.college_type))
    // (Add more filters as needed)
    return matchesSearch && matchesCountry && matchesType
  })

  const getCollegesByStage = (stage: string) => {
    return filteredColleges.filter(college => college.application_status === stage)
  }

  const getStageStats = () => {
    return KANBAN_STAGES.map(stage => ({
      ...stage,
      count: getCollegesByStage(stage.key).length
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-slate-600">Loading your college list...</span>
      </div>
    )
  }

  const stageStats = getStageStats()

  // Sync scroll between top and main Kanban scrollbars
  const handleTopScroll = () => {
    if (mainScrollRef.current && topScrollRef.current) {
      mainScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft
    }
  }
  const handleMainScroll = () => {
    if (mainScrollRef.current && topScrollRef.current) {
      topScrollRef.current.scrollLeft = mainScrollRef.current.scrollLeft
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800">My College List</h2>
          <p className="text-slate-600 text-base sm:text-lg">Manage your college application journey</p>
        </div>
        {/* Filter menu */}
        <CollegeFiltersHorizontal
          filters={filters}
          onFiltersChange={setFilters}
          availableCountries={availableCountries}
          availableCampusSettings={CAMPUS_SETTINGS.map((c) => c.label)}
          availableCollegeSizes={COLLEGE_SIZES.map((c) => c.label)}
          availableInstitutionTypes={availableCollegeTypes}
          totalColleges={colleges.length}
          filteredCount={filteredColleges.length}
        />
        {/* Centered Search Field */}
        <div className="flex justify-center w-full mt-2">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search colleges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-slate-800 placeholder-slate-400 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-blue-600"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"} className={message.type === "success" ? "border-green-200 bg-green-50" : ""}>
          <div className="flex items-center justify-between">
            <AlertDescription className={message.type === "success" ? "text-green-800" : ""}>{message.text}</AlertDescription>
            <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </Alert>
      )}

      {/* Desktop Kanban Board */}
      <div className="hidden lg:flex flex-col justify-center w-full bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 rounded-2xl p-4 shadow-inner">
        {/* Top horizontal scrollbar (synced) */}
        <div
          ref={topScrollRef}
          className="overflow-x-auto mb-2"
          style={{ WebkitOverflowScrolling: 'touch' }}
          onScroll={handleTopScroll}
        >
          <div className="h-2 min-w-[900px]" />
        </div>
        {/* Centering wrapper for Kanban columns */}
        <div className="flex justify-center w-full">
          <div
            ref={mainScrollRef}
            className="overflow-x-auto"
            style={{ WebkitOverflowScrolling: 'touch' }}
            onScroll={handleMainScroll}
          >
            <div className="flex gap-8 pb-4 min-w-max">
              {stageStats.map((stage, idx) => {
                const stageDef = KANBAN_STAGES.find(s => s.key === stage.key) || KANBAN_STAGES[0];
                const textClass = 'text' in stageDef ? (stageDef as any).text : 'text-slate-900';
                return (
                  <div
                    key={stage.key}
                    className={`w-80 flex-shrink-0 ${stageDef.color} ${stageDef.border} rounded-2xl shadow-lg p-4 min-h-[500px] transition-all duration-200 ${
                      dragOverStage === stage.key ? 'border-blue-400 bg-blue-50 scale-105 shadow-xl' : 'hover:shadow-xl'
                    } ${textClass}`}
                    onDragOver={(e) => handleDragOver(e, stage.key)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, stage.key as CollegeListItem['application_status'])}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-slate-800 text-lg tracking-tight">{stage.label}</h3>
                        <Badge variant="secondary" className="mt-1 bg-white text-blue-800 border-blue-200">
                          {stage.count} colleges
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddCollege(stage.key as CollegeListItem['application_status'])}
                        className="h-8 w-8 p-0 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {getCollegesByStage(stage.key).map((college) => (
                        <CollegeCard
                          key={college.id}
                          college={college}
                          onUpdate={handleCollegeUpdate}
                          onDragStart={(e) => handleDragStart(e, college)}
                          isDragging={draggedCollege?.id === college.id}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        {/* Bottom horizontal scrollbar */}
        <div className="overflow-x-auto mt-2" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="h-2 min-w-[900px]" />
        </div>
      </div>

      {/* Mobile Kanban Board */}
      <div className="lg:hidden space-y-4 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 rounded-2xl p-2 shadow-inner">
        {stageStats.map((stage) => {
          const collegesInStage = getCollegesByStage(stage.key)
          const isExpanded = expandedStages.has(stage.key)
          const stageDef = KANBAN_STAGES.find(s => s.key === stage.key) || KANBAN_STAGES[0];
          const textClass = 'text' in stageDef ? (stageDef as any).text : 'text-slate-900';
          return (
            <Card key={stage.key} className={`border-2 ${stageDef.color} ${stageDef.border} rounded-2xl shadow-lg ${textClass}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg font-semibold text-slate-800 tracking-tight">
                      {stage.label}
                    </CardTitle>
                    <Badge variant="secondary" className="bg-white text-blue-800 border-blue-200">
                      {stage.count} colleges
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAddCollege(stage.key as CollegeListItem['application_status'])}
                      className="h-8 w-8 p-0 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStageExpansion(stage.key)}
                      className="h-8 w-8 p-0"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {collegesInStage.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-4">
                        No colleges in this stage
                      </p>
                    ) : (
                      collegesInStage.map((college) => (
                        <CollegeCard
                          key={college.id}
                          college={college}
                          onUpdate={handleCollegeUpdate}
                          onDragStart={(e) => handleDragStart(e, college)}
                          isDragging={draggedCollege?.id === college.id}
                        />
                      ))
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Add College Dialog */}
      <AddCollegeDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        defaultStage={selectedStage}
        onCollegeAdded={handleCollegeUpdate}
      />
    </div>
  )
} 