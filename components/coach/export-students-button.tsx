"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Download, FileSpreadsheet, FileText } from "lucide-react"

interface CoachStudent {
  id: string
  full_name: string
  email: string
  grade_level?: string
  gpa?: number
  profile_completion: number
  college_matches_count: number
  college_list_count: number
  application_progress: {
    considering: number
    planning_to_apply: number
    applied: number
    interviewing: number
    accepted: number
    rejected: number
    enrolled: number
  }
  assigned_at: string
}

interface ExportStudentsButtonProps {
  students: CoachStudent[]
  disabled?: boolean
}

export function ExportStudentsButton({ students, disabled = false }: ExportStudentsButtonProps) {
  const [loading, setLoading] = useState(false)

  const formatDataForExport = () => {
    return students.map(student => ({
      'Student Name': student.full_name,
      'Email': student.email,
      'Grade Level': student.grade_level || 'N/A',
      'GPA': student.gpa || 'N/A',
      'Profile Completion': `${student.profile_completion}%`,
      'College Matches': student.college_matches_count,
      'Colleges in List': student.college_list_count,
      'Considering': student.application_progress.considering,
      'Planning to Apply': student.application_progress.planning_to_apply,
      'Applied': student.application_progress.applied,
      'Interviewing': student.application_progress.interviewing,
      'Accepted': student.application_progress.accepted,
      'Rejected': student.application_progress.rejected,
      'Enrolled': student.application_progress.enrolled,
      'Assigned Date': new Date(student.assigned_at).toLocaleDateString()
    }))
  }

  const downloadCSV = () => {
    setLoading(true)
    try {
      const data = formatDataForExport()
      
      if (data.length === 0) {
        alert('No students to export')
        return
      }

      // Create CSV content
      const headers = Object.keys(data[0])
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row]
            // Escape commas and quotes in CSV
            return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
              ? `"${value.replace(/"/g, '""')}"` 
              : value
          }).join(',')
        )
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `coach-students-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log(`Exported ${data.length} students to CSV`)
    } catch (error) {
      console.error('Error exporting CSV:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const downloadExcel = async () => {
    setLoading(true)
    try {
      const data = formatDataForExport()
      
      if (data.length === 0) {
        alert('No students to export')
        return
      }

      // Call backend API for Excel generation
      const response = await fetch('/api/coach/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: data })
      })

      if (!response.ok) {
        throw new Error('Failed to generate Excel file')
      }

      // Download the Excel file
      const blob = await response.blob()
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `coach-students-${new Date().toISOString().split('T')[0]}.xlsx`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log(`Exported ${data.length} students to Excel`)
    } catch (error) {
      console.error('Error exporting Excel:', error)
      alert('Failed to export Excel file. CSV export is still available.')
    } finally {
      setLoading(false)
    }
  }

  if (students.length === 0) {
    return (
      <Button 
        variant="outline" 
        disabled
        className="bg-white text-slate-800 border-slate-300"
      >
        <Download className="h-4 w-4 mr-2" />
        No Data to Export
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          disabled={disabled || loading}
          className="bg-white text-slate-800 border-slate-300 hover:bg-slate-50 hover:text-slate-900"
        >
          <Download className="h-4 w-4 mr-2" />
          {loading ? 'Exporting...' : 'Export Data'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={downloadCSV} disabled={loading}>
          <FileText className="h-4 w-4 mr-2" />
          Download CSV ({students.length} students)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadExcel} disabled={loading}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Download Excel ({students.length} students)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

