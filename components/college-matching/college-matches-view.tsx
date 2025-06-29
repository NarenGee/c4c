"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getStudentCollegeMatches, deleteCollegeMatches, type CollegeMatch } from "@/app/actions/college-matching"
import { addCollegeToList } from "@/app/actions/college-list"
import { Brain, ExternalLink, MapPin, DollarSign, Plus, Trash2 } from "lucide-react"

interface CollegeMatchesViewProps {
  refreshTrigger?: number
}

export function CollegeMatchesView({ refreshTrigger }: CollegeMatchesViewProps) {
  const [matches, setMatches] = useState<CollegeMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadMatches = async () => {
    try {
      const result = await getStudentCollegeMatches()
      if (result.success && result.matches) {
        setMatches(result.matches)
      }
    } catch (error) {
      console.error("Failed to load matches:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToList = async (match: CollegeMatch) => {
    setAdding(match.id)
    try {
      const result = await addCollegeToList({
        college_name: match.college_name,
        college_location: match.city && match.country ? `${match.city}, ${match.country}` : match.country,
        college_type: match.program_type,
        tuition_range: match.estimated_cost,
        source: "AI Recommended",
        notes: `AI Match Score: ${Math.round(match.match_score * 100)}% - ${match.justification}`,
        priority: match.match_score >= 0.8 ? 1 : match.match_score >= 0.6 ? 2 : 3,
      })

      if (result.success) {
        // Could show a success message here
      }
    } catch (error) {
      console.error("Failed to add to list:", error)
    } finally {
      setAdding(null)
    }
  }

  const handleDeleteMatches = async () => {
    setDeleting(true)
    try {
      const result = await deleteCollegeMatches()
      if (result.success) {
        setMatches([])
      }
    } catch (error) {
      console.error("Failed to delete matches:", error)
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    loadMatches()
  }, [refreshTrigger])

  const getMatchColor = (score: number) => {
    if (score >= 0.8) return "bg-green-100 text-green-800"
    if (score >= 0.6) return "bg-blue-100 text-blue-800"
    if (score >= 0.4) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getMatchLabel = (score: number) => {
    if (score >= 0.8) return "Excellent Match"
    if (score >= 0.6) return "Good Match"
    if (score >= 0.4) return "Fair Match"
    return "Reach School"
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading AI recommendations...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI College Recommendations ({matches.length})
            </CardTitle>
            <CardDescription>Personalized recommendations powered by Gemini AI</CardDescription>
          </div>
          {matches.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleDeleteMatches} disabled={deleting}>
              <Trash2 className="h-4 w-4 mr-1" />
              {deleting ? "Clearing..." : "Clear All"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <Alert>
            <Brain className="h-4 w-4" />
            <AlertDescription>
              No AI recommendations yet. Use the profile form above to generate personalized college matches.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <div key={match.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{match.college_name}</h3>
                      <Badge className={getMatchColor(match.match_score)}>
                        {Math.round(match.match_score * 100)}% - {getMatchLabel(match.match_score)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      {match.city && match.country && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {match.city}, {match.country}
                        </span>
                      )}
                      {match.estimated_cost && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {match.estimated_cost}
                        </span>
                      )}
                      {match.program_type && <Badge variant="secondary">{match.program_type}</Badge>}
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">{match.justification}</p>

                    {match.admission_requirements && (
                      <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded mb-3">
                        <strong>Admission Requirements:</strong> {match.admission_requirements}
                      </div>
                    )}

                    {match.source_links && match.source_links.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {match.source_links.map((link, index) => (
                          <a
                            key={index}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Source {index + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleAddToList(match)}
                    disabled={adding === match.id}
                    className="ml-4"
                  >
                    {adding === match.id ? (
                      "Adding..."
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        Add to List
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Generated {new Date(match.generated_at).toLocaleDateString()} at{" "}
                  {new Date(match.generated_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
