import { useState, useEffect } from "react"
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
import { getProfileGuidanceResponse, extractSuggestions } from "@/lib/gemini"

interface Message {
  role: "user" | "assistant"
  content: string
  suggestions?: string[]
}

interface GuidanceChatProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fieldName: string
  initialPrompt?: string
  currentValue?: string | string[] | boolean | null
  onSuggestion?: (suggestion: string) => void
}

const fieldPrompts: Record<string, string> = {
  intendedMajor: "I'm exploring different majors and would love some guidance on what might be a good fit for me.",
  campusPreference: "I'm trying to decide what type of campus environment would suit me best.",
  collegeSize: "I'm not sure what size college would be right for me.",
  locationPreference: "I'm thinking about where I'd like to study but need help deciding.",
  academicReputation: "I'm wondering how important academic reputation should be in my college choice.",
  gradeLevel: "I have questions about my current academic level and college preparation.",
  additionalPreferences: "I'd like to explore what other factors I should consider when choosing colleges."
}

export function GuidanceChat({
  open,
  onOpenChange,
  fieldName,
  initialPrompt,
  currentValue,
  onSuggestion
}: GuidanceChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open && messages.length === 0) {
      const prompt = initialPrompt || fieldPrompts[fieldName] || "I'd like some guidance with this field."
      handleSend(prompt, false)
    }
  }, [open, fieldName, initialPrompt, messages.length])

  const handleSend = async (message?: string, addToMessages = true) => {
    const messageToSend = message || inputMessage.trim()
    if (!messageToSend || isLoading) return

    const userMessage: Message = { role: "user", content: messageToSend }
    const newMessages = addToMessages ? [...messages, userMessage] : [userMessage]
    
    if (addToMessages) {
      setMessages(newMessages)
    }
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await getProfileGuidanceResponse(
        newMessages.map(m => ({ role: m.role, content: m.content })),
        fieldName,
        currentValue
      )
      
      // Extract suggestions from response
      const suggestions = extractSuggestions(response)
      const cleanResponse = response.replace(/SUGGESTIONS:\s*\[.*?\]/i, '').trim()
      
      const assistantMessage: Message = { 
        role: "assistant", 
        content: cleanResponse,
        suggestions: suggestions.length > 0 ? suggestions : undefined
      }
      
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error getting response:", error)
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment." 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (onSuggestion) {
      onSuggestion(suggestion)
      onOpenChange(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Find the last assistant message index
  const lastAssistantIndex = [...messages].reverse().findIndex(m => m.role === "assistant")
  const lastAssistantMessageIndex = lastAssistantIndex === -1 ? -1 : messages.length - 1 - lastAssistantIndex

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Virtual Coach Profile Guidance</DialogTitle>
          <DialogDescription>
            Get personalized guidance for your college application profile
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4 max-h-96">
          <div className="space-y-4">
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
                            return (
                              <div key={lineIndex} className="flex items-start gap-2">
                                <span className="text-blue-500 font-bold mt-0.5">•</span>
                                <span className="flex-1">{line.replace(/^•\s*/, '')}</span>
                              </div>
                            )
                          }
                          // Render bold text (**) as <strong>
                          if (line.includes('**')) {
                            const parts = line.split(/(\*\*.*?\*\*)/g)
                            return (
                              <div key={lineIndex}>
                                {parts.map((part, partIndex) => {
                                  if (part.startsWith('**') && part.endsWith('**')) {
                                    return (
                                      <strong key={partIndex} className="font-semibold text-blue-800">
                                        {part.slice(2, -2)}
                                      </strong>
                                    )
                                  }
                                  return <span key={partIndex}>{part}</span>
                                })}
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
                      <p className="text-xs font-medium opacity-80">Quick selections:</p>
                      <div className="flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion, idx) => (
                          <Button
                            key={idx}
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-xs h-7 px-2"
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
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
        
        <div className="flex gap-2 pt-4 border-t">
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