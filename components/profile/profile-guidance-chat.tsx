import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Loader2, Send } from "lucide-react"
import { getProfileGuidanceResponse, extractSuggestions, FIELD_OPTIONS } from "@/lib/gemini"

interface Message {
  role: "user" | "assistant"
  content: string
  suggestions?: string[]
}

interface ProfileGuidanceChatProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fieldName: string
  initialPrompt?: string
  currentValue?: string | string[] | boolean | null
  countryOfResidence?: string;
  onSuggestion?: (suggestion: string) => void
  onMultiSuggestion?: (suggestion: string, shouldAdd: boolean) => void
}

const fieldPrompts: Record<string, string> = {
  intendedMajor: "I'm not sure what to major in. Can you help me explore options that might be a good fit?",
  campusPreference: "I'm trying to decide what campus environment would work best for me. Any guidance?",
  campusSetting: "Urban, suburban, or rural campus - I'm not sure which would suit me best. Help me think through this?",
  collegeSize: "What size college would be right for me? I'd love to understand the differences.",
  locationPreference: "I'm thinking about where to study but need help deciding. What factors should I consider?",
  geographicPreference: "I'm considering different countries for college. How do I choose?",
  academicReputation: "How important should academic reputation be in my college choice?",
  costImportance: "I'm not sure how to think about college costs. What should I consider?",
  gradeLevel: "I have questions about my current academic level and college prep. Where do I stand?",
  extracurricularActivities: "How do my extracurricular activities help with college applications?",
  academicInterests: "I'd like to explore my academic interests and see how they align with college programs.",
  careerGoals: "How should my career goals influence my college choices?",
  financialAid: "I have questions about financial aid. Can you help me understand my options?",
  intendedMajors: "I'm not sure what to major in. Can you help me explore options that might be a good fit?",
  additionalPreferences: "I'd like to explore what additional preferences I should consider when choosing colleges. Can you help me think through campus life, academic opportunities, support services, and other factors that would make me feel engaged and supported?"
}

export function ProfileGuidanceChat({
  open,
  onOpenChange,
  fieldName,
  initialPrompt,
  currentValue,
  countryOfResidence,
  onSuggestion,
  onMultiSuggestion
}: ProfileGuidanceChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentField, setCurrentField] = useState<string>("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Function to validate suggestions against available field options
  const validateSuggestions = (suggestions: string[], fieldName: string): string[] => {
    console.log("🔍 validateSuggestions called with:", { suggestions, fieldName })
    
    const fieldOptions = FIELD_OPTIONS[fieldName as keyof typeof FIELD_OPTIONS]
    console.log("📋 Field options:", fieldOptions)
    
    if (!fieldOptions) {
      console.log("❌ No field options found for", fieldName)
      return [] // No valid options for this field
    }
    
    let validOptions: string[] = []
    
    if (Array.isArray(fieldOptions)) {
      // For arrays like locationPreference, geographicPreference
      validOptions = fieldOptions
    } else {
      // For objects, get both keys and values
      validOptions = [...Object.keys(fieldOptions), ...Object.values(fieldOptions)]
    }
    
    console.log("✅ Valid options for comparison:", validOptions)
    
    // Filter suggestions to only include those that match valid options (case-insensitive)
    const filteredSuggestions = suggestions.filter(suggestion => {
      const matches = validOptions.some(option => 
        option.toLowerCase().trim() === suggestion.toLowerCase().trim()
      )
      console.log(`🔍 Checking "${suggestion}" against valid options: ${matches}`)
      return matches
    })
    
    console.log("✅ Filtered suggestions:", filteredSuggestions)
    return filteredSuggestions
  }

  useEffect(() => {
    if (open) {
      // If this is the first time opening or no messages exist, add initial prompt
      if (messages.length === 0) {
        const prompt = initialPrompt || fieldPrompts[fieldName] || "I'd like some guidance with this field."
        setCurrentField(fieldName)
        handleSend(prompt, false)
      }
      // If the field has changed, add a field-specific prompt while keeping history
      else if (fieldName !== currentField) {
        const fieldSwitchPrompt = initialPrompt || fieldPrompts[fieldName] || `I'd like some guidance with ${fieldName}.`
        setCurrentField(fieldName)
        handleSend(fieldSwitchPrompt, true) // Add to messages this time
      }
    }
  }, [open, fieldName, initialPrompt, currentField, messages.length])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    // Add a small delay to ensure the DOM is updated before scrolling
    const timer = setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight
        }
      }
    }, 100); // 100ms delay should be enough

    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, [messages])

  const handleSend = async (message?: string, addToMessages = true) => {
    const messageToSend = message || inputMessage.trim()
    if (!messageToSend || isLoading) return

    console.log("🎯 handleSend called with:", { messageToSend, addToMessages, fieldName, currentValue })

    const userMessage: Message = { role: "user", content: messageToSend }
    const newMessages = addToMessages ? [...messages, userMessage] : [userMessage]
    
    if (addToMessages) {
      setMessages(newMessages)
    }
    setInputMessage("")
    setIsLoading(true)

    console.log("🔄 About to call getProfileGuidanceResponse...")

    try {
      const response = await getProfileGuidanceResponse(
        newMessages.map(m => ({ role: m.role, content: m.content })),
        fieldName,
        currentValue,
        countryOfResidence
      )
      
      console.log("✅ Got response from getProfileGuidanceResponse:", response)
      
      // Extract suggestions from response
      const suggestions = extractSuggestions(response)
      const cleanResponse = response
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/SUGGESTIONS:\s*\[.*?\]/i, '').trim()
      
      console.log("🧹 Clean response:", cleanResponse)
      console.log("💡 Extracted suggestions:", suggestions)
      console.log("🔍 Raw response (first 500 chars):", response.substring(0, 500))
      
      // Validate suggestions against field options
      const validSuggestions = validateSuggestions(suggestions, fieldName)
      console.log("✅ Valid suggestions:", validSuggestions)
      console.log("🎯 Field options for", fieldName, ":", FIELD_OPTIONS[fieldName as keyof typeof FIELD_OPTIONS])
      
      const assistantMessage: Message = { 
        role: "assistant", 
        content: cleanResponse,
        suggestions: validSuggestions.length > 0 ? validSuggestions : undefined
      }
      
      setMessages(prev => [...prev, assistantMessage])
      console.log("📨 Added assistant message to state")
    } catch (error) {
      console.error("❌ Error getting response:", error)
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment." 
      }])
    } finally {
      setIsLoading(false)
      console.log("🏁 handleSend completed")
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    // For locationPreference, geographicPreference, and additionalPreferences, support multiple selections
    if ((fieldName === 'locationPreference' || fieldName === 'geographicPreference' || fieldName === 'additionalPreferences') && onMultiSuggestion) {
      // Check if this suggestion is already selected
      const currentSelections = Array.isArray(currentValue) ? currentValue : []
      const isAlreadySelected = currentSelections.includes(suggestion)
      
      // Toggle the selection
      onMultiSuggestion(suggestion, !isAlreadySelected)
      
      // Don't close the dialog for multi-select fields
      return
    }
    
    // For single-select fields, use the original behavior
    if (onSuggestion) {
      const fieldOptions = FIELD_OPTIONS[fieldName as keyof typeof FIELD_OPTIONS];
      let valueToSend = suggestion;

      // If the field options are an object (like for collegeSize), check if the suggestion is a key.
      // If it is, we'll send the corresponding value instead of the key.
      if (fieldOptions && !Array.isArray(fieldOptions)) {
        const optionKeys = Object.keys(fieldOptions);
        if (optionKeys.includes(suggestion)) {
          valueToSend = fieldOptions[suggestion as keyof typeof fieldOptions];
        }
      }

      onSuggestion(valueToSend)
      onOpenChange(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Virtual Coach Profile Guidance</DialogTitle>
          <DialogDescription>
            Get personalized guidance for your college application profile
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4 p-1">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl shadow-md ${
                  message.role === "user" 
                    ? "bg-blue-600 text-white ml-4" 
                    : "bg-slate-50 text-slate-800 mr-4 border border-slate-200"
                } font-sans transition-all duration-200" style={{wordBreak: 'break-word'}}`}>
                  <div className="text-base whitespace-pre-wrap leading-relaxed">
                    {message.role === "assistant" ? (
                      <div className="space-y-2">
                        {message.content.split('\n').map((line, lineIndex) => {
                          // Render bullet points elegantly
                          if (line.trim().startsWith('•')) {
                            const bulletLine = line.replace(/^•\s*/, '')
                            const parts = bulletLine.split(/(\*\*.*?\*\*)/g)
                            return (
                              <div key={lineIndex} className="flex items-start gap-2">
                                <span className="text-blue-500 font-bold mt-0.5">•</span>
                                <span className="flex-1">
                                  {parts.map((part, partIndex) =>
                                    part.startsWith('**') && part.endsWith('**')
                                      ? <strong key={partIndex} className="font-semibold text-blue-800">{part.slice(2, -2)}</strong>
                                      : <span key={partIndex}>{part}</span>
                                  )}
                                </span>
                              </div>
                            )
                          }
                          // Render bold text (**) as <strong> for non-bullet lines
                          if (line.includes('**')) {
                            const parts = line.split(/(\*\*.*?\*\*)/g)
                            return (
                              <div key={lineIndex}>
                                {parts.map((part, partIndex) =>
                                  part.startsWith('**') && part.endsWith('**')
                                    ? <strong key={partIndex} className="font-semibold text-blue-800">{part.slice(2, -2)}</strong>
                                    : <span key={partIndex}>{part}</span>
                                )}
                              </div>
                            )
                          }
                          // Regular line
                          return <div key={lineIndex}>{line}</div>
                        })}
                      </div>
                    ) : (
                      <p>{message.content}</p>
                    )}
                  </div>
                  
                  {/* Render suggestion buttons */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium opacity-80">
                        {(fieldName === 'locationPreference' || fieldName === 'geographicPreference') ? 'Select countries (multiple allowed):' : 
                         fieldName === 'additionalPreferences' ? 'Select preferences (multiple allowed):' : 'Quick selections:'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion, idx) => {
                          // Check if this suggestion is selected for multi-select fields
                          const isSelected = (fieldName === 'locationPreference' || fieldName === 'geographicPreference' || fieldName === 'additionalPreferences') && 
                            Array.isArray(currentValue) && 
                            currentValue.includes(suggestion)
                          
                          return (
                            <Button
                              key={idx}
                              variant={isSelected ? "default" : "secondary"}
                              size="sm"
                              onClick={() => handleSuggestionClick(suggestion)}
                              className={`text-xs h-7 px-2 ${
                                isSelected ? 'bg-primary text-primary-foreground' : ''
                              }`}
                            >
                              {suggestion}
                              {isSelected && (fieldName === 'locationPreference' || fieldName === 'geographicPreference' || fieldName === 'additionalPreferences') && (
                                <span className="ml-1">✓</span>
                              )}
                            </Button>
                          )
                        })}
                        
                        {/* Add "I'm done" button for multi-select fields */}
                        {(fieldName === 'locationPreference' || fieldName === 'geographicPreference' || fieldName === 'additionalPreferences') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="text-xs h-7 px-3 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                          >
                            I'm done
                          </Button>
                        )}
                      </div>
                      {(fieldName === 'locationPreference' || fieldName === 'geographicPreference' || fieldName === 'additionalPreferences') && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-muted-foreground">
                            {fieldName === 'additionalPreferences' 
                              ? 'Click to add/remove preferences. Dialog stays open for multiple selections.'
                              : 'Click to add/remove countries. Dialog stays open for multiple selections.'}
                          </p>
                          {Array.isArray(currentValue) && currentValue.length > 0 && (
                            <div className="flex items-center justify-between p-2 bg-muted rounded">
                              <span className="text-xs">
                                Selected: {currentValue.join(", ")}
                              </span>
                              <Button
                                size="sm"
                                onClick={() => onOpenChange(false)}
                                className="ml-2"
                              >
                                Done
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted p-3 rounded-lg mr-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="flex gap-2 pt-4 border-t mt-4">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about this field..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={() => handleSend()} 
            disabled={isLoading || !inputMessage.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {/* Coach prompt with logo below the input field */}
        <div className="w-full mt-3 mb-2 flex items-center justify-center gap-3">
          <img src="/Untitled-1-1.png" alt="Coaching for College Logo" width={32} height={32} className="rounded-full shadow" />
          <span className="inline-block text-slate-600 text-base bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 shadow-sm">
            If you need further assistance,{' '}
            <a
              href="https://cal.com/coachingforcollege/preliminary-meeting"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 underline font-semibold hover:text-blue-900 transition-colors"
            >
              talk to one of our coaches
            </a>.
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
} 