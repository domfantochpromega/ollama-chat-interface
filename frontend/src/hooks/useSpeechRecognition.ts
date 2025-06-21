import { useState, useEffect, useRef, useCallback } from 'react'

type MicrophoneMode = 'push-to-talk' | 'auto-detect'

interface SpeechRecognitionHook {
  isListening: boolean
  transcript: string
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  error: string | null
  isSupported: boolean
  microphoneMode: MicrophoneMode
  setMicrophoneMode: (mode: MicrophoneMode) => void
  startPushToTalk: () => void
  stopPushToTalk: () => void
  onSpeechComplete?: (transcript: string) => void
  setOnSpeechComplete: (callback: (transcript: string) => void) => void
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
  const [microphoneMode, setMicrophoneMode] = useState<MicrophoneMode>('push-to-talk')
  const recognitionRef = useRef<any>(null)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const onSpeechCompleteRef = useRef<((transcript: string) => void) | undefined>()

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

      const currentTranscript = finalTranscript || interimTranscript
      setTranscript(currentTranscript)

      if (microphoneMode === 'auto-detect' && currentTranscript.trim()) {
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current)
        }
        
        silenceTimeoutRef.current = setTimeout(() => {
          const latestTranscript = transcript || currentTranscript
          if (latestTranscript.trim() && onSpeechCompleteRef.current) {
            recognition.stop()
            onSpeechCompleteRef.current(latestTranscript)
          }
        }, 5000)
      }
    }

    recognition.onerror = (event: any) => {
      setError(`Erro no reconhecimento de voz: ${event.error}`)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
        silenceTimeoutRef.current = null
      }
    }

    return () => {
      if (recognition) {
        recognition.stop()
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
      }
    }
  }, [isSupported, microphoneMode])

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
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }
  }, [])

  const startPushToTalk = useCallback(() => {
    if (microphoneMode === 'push-to-talk') {
      startListening()
    }
  }, [microphoneMode, startListening])

  const stopPushToTalk = useCallback(() => {
    if (microphoneMode === 'push-to-talk' && isListening) {
      stopListening()
      if (transcript.trim() && onSpeechCompleteRef.current) {
        onSpeechCompleteRef.current(transcript)
      }
    }
  }, [microphoneMode, isListening, transcript, stopListening])

  const setOnSpeechComplete = useCallback((callback: (transcript: string) => void) => {
    onSpeechCompleteRef.current = callback
  }, [])

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    error,
    isSupported,
    microphoneMode,
    setMicrophoneMode,
    startPushToTalk,
    stopPushToTalk,
    onSpeechComplete: onSpeechCompleteRef.current,
    setOnSpeechComplete
  }
}
