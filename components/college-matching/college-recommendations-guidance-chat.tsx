"use client"
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
import { Loader2, Send, Brain, HelpCircle } from "lucide-react"
import { type CollegeMatch } from "@/lib/college-matching-client"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface CollegeRecommendationsGuidanceChatProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collegeMatches: CollegeMatch[]
  studentProfile: any // Student profile data
}

export function CollegeRecommendationsGuidanceChat({
  open,
  onOpenChange,
  collegeMatches,
  studentProfile
}: CollegeRecommendationsGuidanceChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)

  useEffect(() => {
    if (open && messages.length === 0) {
      setIsInitializing(true)
      const initialPrompt = "Can you help me understand my college recommendations?"
      handleSend(initialPrompt, false)
    }
  }, [open, messages.length])

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
      const response = await getCollegeRecommendationsGuidance(
        newMessages.map(m => ({ role: m.role, content: m.content })),
        collegeMatches,
        studentProfile
      )
      
      const assistantMessage: Message = { 
        role: "assistant", 
        content: response
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
      setIsInitializing(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const suggestedQuestions = [
    "Why didn't you recommend any US colleges?",
    "Why wasn't [specific college] included in my recommendations?",
    "What makes these colleges a good fit for me?",
    "How can I improve my chances for reach schools?",
    "Which of these colleges offer the best financial aid?",
    "What should I focus on to strengthen my application?"
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            College Recommendations Guidance
          </DialogTitle>
          <DialogDescription>
            Ask questions about your college recommendations and get personalized insights
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl shadow-md ${
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
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-50 p-4 rounded-2xl mr-4 border border-slate-200 flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-slate-600">
                    {isInitializing ? "Analyzing your profile and generating advice..." : "Thinking..."}
                  </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Suggested Questions */}
        {messages.length === 0 && (
          <div className="border-t pt-4 pb-2">
            <p className="text-sm font-medium text-slate-700 mb-3">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSend(question)}
                  className="text-xs h-auto py-2 px-3"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex gap-2 pt-4 border-t mt-auto">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your college recommendations..."
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

        {/* Coach prompt with logo */}
        <div className="w-full mt-3 mb-2 flex items-center justify-center gap-3">
          <img src="/Untitled-1-1.png" alt="Coaching for College Logo" width={32} height={32} className="rounded-full shadow" />
          <span className="inline-block text-slate-600 text-sm bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 shadow-sm">
            Need more personalized guidance?{' '}
            <a
              href="https://cal.com/coachingforcollege/preliminary-meeting"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 underline font-semibold hover:text-blue-900 transition-colors"
            >
              Schedule a consultation with our coaches
            </a>.
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Function to get guidance response from Gemini
async function getCollegeRecommendationsGuidance(
  messages: { role: string; content: string }[],
  collegeMatches: CollegeMatch[],
  studentProfile: any
): Promise<string> {
  try {
    const response = await fetch('/api/college-recommendations-guidance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        collegeMatches,
        studentProfile
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to get guidance response')
    }

    const data = await response.json()
    return data.response
  } catch (error) {
    console.error('Error getting guidance:', error)
    throw error
  }
} 