import { useState, useEffect, useRef, useCallback } from 'react'

interface SpeechSynthesisHook {
  speak: (text: string) => void
  speaking: boolean
  stop: () => void
  pause: () => void
  resume: () => void
  isSupported: boolean
}

export const useSpeechSynthesis = (): SpeechSynthesisHook => {
  const [speaking, setSpeaking] = useState(false)
  const [voicesLoaded, setVoicesLoaded] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  useEffect(() => {
    if (!isSupported) return

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        setVoicesLoaded(true)
      }
    }

    loadVoices()

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }

    const handleSpeechEnd = () => {
      setSpeaking(false)
    }

    const handleSpeechStart = () => {
      setSpeaking(true)
    }

    if (utteranceRef.current) {
      utteranceRef.current.addEventListener('end', handleSpeechEnd)
      utteranceRef.current.addEventListener('start', handleSpeechStart)
    }

    return () => {
      if (utteranceRef.current) {
        utteranceRef.current.removeEventListener('end', handleSpeechEnd)
        utteranceRef.current.removeEventListener('start', handleSpeechStart)
      }
    }
  }, [isSupported])

  const speak = useCallback((text: string) => {
    if (!isSupported) {
      console.warn('Síntese de voz não é suportada neste navegador')
      return
    }

    if (!voicesLoaded) {
      console.warn('Vozes ainda não foram carregadas')
      setTimeout(() => speak(text), 100)
      return
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utteranceRef.current = utterance

    utterance.lang = 'pt-BR'
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 1

    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = (e) => {
      console.error('Erro na síntese de voz:', e)
      setSpeaking(false)
    }

    const voices = window.speechSynthesis.getVoices()
    const portugueseVoice = voices.find(voice => 
      voice.lang.includes('pt') || voice.lang.includes('PT')
    )
    
    if (portugueseVoice) {
      utterance.voice = portugueseVoice
    }

    window.speechSynthesis.speak(utterance)
  }, [isSupported, voicesLoaded])

  const stop = useCallback(() => {
    if (isSupported && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
    }
  }, [isSupported])

  const pause = useCallback(() => {
    if (isSupported && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause()
    }
  }, [isSupported])

  const resume = useCallback(() => {
    if (isSupported && window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
    }
  }, [isSupported])

  return {
    speak,
    speaking,
    stop,
    pause,
    resume,
    isSupported
  }
}
