import { useState, useEffect, useRef, useCallback } from 'react'

interface SpeechRecognitionHook {
  isListening: boolean
  transcript: string
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  error: string | null
  isSupported: boolean
}

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  const isSupported = typeof window !== 'undefined' && 
    (window.SpeechRecognition || window.webkitSpeechRecognition)

  useEffect(() => {
    if (!isSupported) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()

    const recognition = recognitionRef.current
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'pt-BR'

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
    }

    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      setTranscript(finalTranscript || interimTranscript)
    }

    recognition.onerror = (event: any) => {
      setError(`Erro no reconhecimento de voz: ${event.error}`)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    return () => {
      if (recognition) {
        recognition.stop()
      }
    }
  }, [isSupported])

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Reconhecimento de voz não é suportado neste navegador')
      return
    }

    if (recognitionRef.current && !isListening) {
      setError(null)
      setTranscript('')
      recognitionRef.current.start()
    }
  }, [isSupported, isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setError(null)
  }, [])

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    error,
    isSupported
  }
}
