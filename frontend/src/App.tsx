import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, X, Bot, User, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface UploadedFile {
  id: string
  name: string
  size: number
  content: string
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    resetTranscript,
    error: speechError,
    isSupported: speechRecognitionSupported
  } = useSpeechRecognition()
  
  const { 
    speak, 
    speaking, 
    stop: stopSpeaking,
    isSupported: speechSynthesisSupported
  } = useSpeechSynthesis()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (transcript && !isListening) {
      setInputMessage(prev => prev + (prev ? ' ' : '') + transcript)
      resetTranscript()
    }
  }, [transcript, isListening, resetTranscript])

  useEffect(() => {
    if (speechError) {
      setError(speechError)
    }
  }, [speechError])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    setError(null)
    
    for (const file of Array.from(files)) {
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`)
        }

        const result = await response.json()
        setUploadedFiles(prev => [...prev, {
          id: result.file_id,
          name: result.filename,
          size: result.size,
          content: result.content
        }])
      } catch (error) {
        console.error('File upload error:', error)
        setError(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() && uploadedFiles.length === 0) return

    setError(null)
    setIsLoading(true)

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')

    try {
      let response: Response

      if (uploadedFiles.length > 0) {
        const formData = new FormData()
        formData.append('message', inputMessage)
        if (conversationId) {
          formData.append('conversation_id', conversationId)
        }
        formData.append('file_ids', uploadedFiles.map(f => f.id).join(','))
        formData.append('model', 'llama3.2')

        response = await fetch(`${API_URL}/api/chat-with-files`, {
          method: 'POST',
          body: formData,
        })
      } else {
        response = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: inputMessage,
            conversation_id: conversationId,
            model: 'llama3.2'
          }),
        })
      }

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!conversationId) {
        setConversationId(result.conversation_id)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: result.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      setUploadedFiles([])

      if (autoSpeak && speechSynthesisSupported) {
        speak(result.response)
      }

    } catch (error) {
      console.error('Chat error:', error)
      setError(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const toggleVoiceRecording = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const handleSpeakMessage = (messageContent: string) => {
    if (speaking) {
      stopSpeaking()
    } else {
      speak(messageContent)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Bot className="w-8 h-8 text-blue-600" />
          Ollama Chat Interface
        </h1>
      </header>

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Welcome to Ollama Chat!</p>
                <p className="text-sm">Start a conversation or upload files to analyze.</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' ? 'bg-blue-600' : 'bg-gray-600'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <Card className={`${message.type === 'user' ? 'bg-blue-600 text-white' : 'bg-white'}`}>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start gap-2">
                        <p className="whitespace-pre-wrap flex-1">{message.content}</p>
                        {message.type === 'assistant' && speechSynthesisSupported && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-gray-100"
                            onClick={() => handleSpeakMessage(message.content)}
                            title={speaking ? "Parar reprodução" : "Reproduzir com voz"}
                          >
                            {speaking ? (
                              <VolumeX className="h-3 w-3" />
                            ) : (
                              <Volume2 className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                      <p className={`text-xs mt-2 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <Card className="bg-white">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      <span className="text-gray-600">Thinking...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        <div className="border-t border-gray-200 bg-white p-4">
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {!speechRecognitionSupported && (
            <Alert className="mb-4 border-yellow-200 bg-yellow-50">
              <AlertDescription className="text-yellow-800">
                Reconhecimento de voz não é suportado neste navegador. Use Chrome ou Edge para melhor experiência.
              </AlertDescription>
            </Alert>
          )}

          {isListening && (
            <Alert className="mb-4 border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800 flex items-center gap-2">
                <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></div>
                Ouvindo... {transcript && `"${transcript}"`}
              </AlertDescription>
            </Alert>
          )}

          {uploadedFiles.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Uploaded files:</p>
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file) => (
                  <Badge key={file.id} variant="secondary" className="flex items-center gap-2">
                    <span className="truncate max-w-32">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-gray-300"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="Anexar arquivo"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            
            {speechRecognitionSupported && (
              <Button
                variant={isListening ? "default" : "outline"}
                size="sm"
                onClick={toggleVoiceRecording}
                disabled={isLoading}
                title={isListening ? "Parar gravação" : "Gravar voz"}
                className={isListening ? "bg-red-600 hover:bg-red-700 text-white animate-pulse" : ""}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            )}

            {speechSynthesisSupported && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoSpeak(!autoSpeak)}
                disabled={isLoading}
                title={autoSpeak ? "Desabilitar resposta automática por voz" : "Habilitar resposta automática por voz"}
                className={autoSpeak ? "bg-green-50 border-green-200" : ""}
              >
                {autoSpeak ? <Volume2 className="w-4 h-4 text-green-600" /> : <VolumeX className="w-4 h-4" />}
              </Button>
            )}
            
            <Input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              accept="*/*"
            />
            
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isListening ? "Falando..." : "Digite sua mensagem ou use o microfone..."}
              disabled={isLoading}
              className="flex-1"
            />
            
            <Button
              onClick={sendMessage}
              disabled={isLoading || (!inputMessage.trim() && uploadedFiles.length === 0)}
              title="Enviar mensagem"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
