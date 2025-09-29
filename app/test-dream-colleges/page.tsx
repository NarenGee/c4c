"use client"

import { useState, useReducer } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Simple form reducer for testing
function testFormReducer(state: any, action: { field: string; value: any }) {
  console.log('Test reducer called:', action.field, action.value)
  console.log('Previous state:', state)
  
  const newState = { ...state, [action.field]: action.value }
  console.log('New state:', newState)
  
  return newState
}

const initialTestData = {
  dreamColleges: [] as string[]
}

export default function TestDreamColleges() {
  const [formData, dispatch] = useReducer(testFormReducer, initialTestData)
  const [testInput, setTestInput] = useState("")

  const addDreamCollege = () => {
    if (testInput.trim()) {
      console.log('Adding dream college:', testInput)
      const newDreamColleges = [...formData.dreamColleges, testInput.trim()]
      console.log('New dream colleges array:', newDreamColleges)
      dispatch({ field: 'dreamColleges', value: newDreamColleges })
      setTestInput("")
    }
  }

  const removeDreamCollege = (college: string) => {
    console.log('Removing dream college:', college)
    const newDreamColleges = formData.dreamColleges.filter(c => c !== college)
    console.log('New dream colleges array after removal:', newDreamColleges)
    dispatch({ field: 'dreamColleges', value: newDreamColleges })
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Test Dream Colleges Functionality</h1>
      
      <div className="space-y-6">
        <div>
          <Label htmlFor="testInput">Add Dream College</Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="testInput"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Enter college name..."
              className="flex-1"
            />
            <Button onClick={addDreamCollege} disabled={!testInput.trim()}>
              Add
            </Button>
          </div>
        </div>

        <div>
          <Label>Current Dream Colleges</Label>
          <div className="mt-2 p-4 bg-slate-100 rounded-lg">
            <div className="text-sm text-slate-600 mb-2">
              Count: {formData.dreamColleges.length}
            </div>
            <div className="text-sm text-slate-600 mb-2">
              Data: {JSON.stringify(formData.dreamColleges)}
            </div>
            {formData.dreamColleges.length === 0 ? (
              <p className="text-slate-500">No dream colleges added yet.</p>
            ) : (
              <div className="space-y-2">
                {formData.dreamColleges.map((college, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                    <span>{college}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeDreamCollege(college)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <Label>Debug Information</Label>
          <div className="mt-2 p-4 bg-slate-100 rounded-lg">
            <pre className="text-xs text-slate-700 overflow-auto">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}



