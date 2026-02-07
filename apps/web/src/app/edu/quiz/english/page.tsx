'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

type Screen = 'start' | 'quiz' | 'results'

interface Question {
    question_id: number
    operation: string  // 'en_to_pl' or 'pl_to_en'
    question_text: string
}

interface QuizResult {
    question_id: number
    question_text: string
    user_answer: number | null
    correct_answer: string
    is_correct: boolean
}

interface QuizResults {
    attempt_id: string
    total_questions: number
    correct_answers: number
    score_percentage: number
    passed: boolean
    passing_threshold: number
    results: QuizResult[]
}

export default function EnglishQuiz() {
    const { user, token } = useAuth()
    const router = useRouter()

    const [screen, setScreen] = useState<Screen>('start')
    const [sessionId, setSessionId] = useState('')
    const [questions, setQuestions] = useState<Question[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<number, string>>({})
    const [currentAnswer, setCurrentAnswer] = useState('')
    const [startTime, setStartTime] = useState<Date | null>(null)
    const [quizResults, setQuizResults] = useState<QuizResults | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [elapsedTime, setElapsedTime] = useState(0)

    const startQuiz = async () => {
        try {
            setIsLoading(true)
            setError('')

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quiz/english/start`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!response.ok) throw new Error('Failed to start quiz')

            const data = await response.json()
            setSessionId(data.session_id)
            setQuestions(data.questions)
            setCurrentIndex(0)
            setAnswers({})
            setCurrentAnswer('')
            setStartTime(new Date())
            setScreen('quiz')
        } catch (err: any) {
            setError(err.message || 'Nie udało się rozpocząć quizu')
        } finally {
            setIsLoading(false)
        }
    }

    const handleNext = () => {
        if (currentAnswer !== '') {
            setAnswers(prev => ({ ...prev, [questions[currentIndex].question_id]: currentAnswer }))
        }

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1)
            const nextQuestionId = questions[currentIndex + 1].question_id
            setCurrentAnswer(answers[nextQuestionId] || '')
        } else {
            submitQuiz()
        }
    }

    const handlePrevious = () => {
        if (currentAnswer !== '') {
            setAnswers(prev => ({ ...prev, [questions[currentIndex].question_id]: currentAnswer }))
        }

        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
            const prevQuestionId = questions[currentIndex - 1].question_id
            setCurrentAnswer(answers[prevQuestionId] || '')
        }
    }

    const submitQuiz = async () => {
        try {
            setIsLoading(true)

            const finalAnswers = { ...answers }
            if (currentAnswer !== '') {
                finalAnswers[questions[currentIndex].question_id] = currentAnswer
            }

            const timeTaken = startTime ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000) : undefined

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quiz/english/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    answers: Object.entries(finalAnswers).map(([qid, ans]) => ({
                        question_id: parseInt(qid),
                        answer: ans
                    })),
                    time_taken_seconds: timeTaken
                })
            })

            if (!response.ok) throw new Error('Failed to submit quiz')

            const data = await response.json()
            setQuizResults(data)
            setScreen('results')
        } catch (err) {
            setError('Nie udało się wysłać quizu')
        } finally {
            setIsLoading(false)
        }
    }

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    useEffect(() => {
        if (screen === 'quiz' && startTime) {
            const interval = setInterval(() => {
                setElapsedTime(Math.floor((new Date().getTime() - startTime.getTime()) / 1000))
            }, 1000)
            return () => clearInterval(interval)
        }
    }, [screen, startTime])

    if (!user) return <div>Ładowanie...</div>

    // START SCREEN
    if (screen === 'start') {
        return (
            <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
                <header style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '1.5rem 2rem'
                }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between' }}>
                        <h1 style={{ margin: 0 }}>📝 Quiz Angielski</h1>
                        <button onClick={() => router.push('/edu')} style={{
                            padding: '0.75rem 1.5rem',
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer'
                        }}>← Powrót</button>
                    </div>
                </header>

                <div style={{ maxWidth: '600px', margin: '3rem auto', padding: '0 1rem' }}>
                    <div style={{ background: 'white', borderRadius: '1rem', padding: '3rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '4rem' }}>🇬🇧</div>
                        <h2>Quiz Angielski</h2>
                        <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
                            <div style={{ padding: '1rem', background: '#f0f4ff', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
                                <strong>📋 Pytania:</strong> EN→PL i PL→EN
                            </div>
                            <div style={{ padding: '1rem', background: '#f0f4ff', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
                                <strong>✅ Próg:</strong> 80%
                            </div>
                        </div>
                        {error && <div style={{ padding: '1rem', background: '#fee', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem' }}>{error}</div>}
                        <button onClick={startQuiz} disabled={isLoading} style={{
                            padding: '1rem 3rem',
                            background: isLoading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            fontSize: '1.2rem'
                        }}>{isLoading ? 'Ładowanie...' : '🚀 Rozpocznij Quiz'}</button>
                    </div>
                </div>
            </div>
        )
    }

    // QUIZ IN PROGRESS
    if (screen === 'quiz' && questions.length > 0) {
        const currentQuestion = questions[currentIndex]
        const progress = ((currentIndex + 1) / questions.length) * 100

        return (
            <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
                <header style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '1.5rem 2rem'
                }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Pytanie {currentIndex + 1} / {questions.length}</h1>
                            <div>⏱️ {formatTime(elapsedTime)}</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '0.5rem', height: '8px' }}>
                            <div style={{ background: 'white', height: '100%', borderRadius: '0.5rem', width: `${progress}%`, transition: 'width 0.3s' }} />
                        </div>
                    </div>
                </header>

                <div style={{ maxWidth: '600px', margin: '3rem auto', padding: '0 1rem' }}>
                    <div style={{ background: 'white', borderRadius: '1rem', padding: '3rem' }}>
                        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <p style={{ color: '#666' }}>{currentQuestion.operation === 'en_to_pl' ? 'EN → PL' : 'PL → EN'}</p>
                            <h2 style={{ fontSize: '3rem', margin: 0 }}>{currentQuestion.question_text}</h2>
                        </div>

                        <input
                            type="text"
                            value={currentAnswer}
                            onChange={(e) => setCurrentAnswer(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleNext()}
                            placeholder="Wpisz tłumaczenie..."
                            autoFocus
                            style={{
                                width: '100%',
                                padding: '1.5rem',
                                fontSize: '2rem',
                                textAlign: 'center',
                                border: '2px solid #ddd',
                                borderRadius: '0.5rem',
                                marginBottom: '2rem'
                            }}
                        />

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {currentIndex > 0 && (
                                <button onClick={handlePrevious} style={{
                                    flex: 1,
                                    padding: '1rem',
                                    background: '#f3f4f6',
                                    color: '#333',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}>← Poprzednie</button>
                            )}
                            <button onClick={handleNext} disabled={isLoading} style={{
                                flex: 1,
                                padding: '1rem',
                                background: isLoading ? '#ccc' : '#667eea',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold'
                            }}>{isLoading ? 'Wysyłanie...' : currentIndex === questions.length - 1 ? '✓ Zakończ' : 'Następne →'}</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // RESULTS SCREEN
    if (screen === 'results' && quizResults) {
        const passed = quizResults.passed

        return (
            <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
                <header style={{
                    background: passed ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    padding: '1.5rem 2rem'
                }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                        <h1 style={{ margin: 0 }}>{passed ? '🎉 Gratulacje!' : '📝 Wyniki Quizu'}</h1>
                    </div>
                </header>

                <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
                    <div style={{
                        background: passed ? '#d1fae5' : '#fee2e2',
                        border: `3px solid ${passed ? '#10b981' : '#ef4444'}`,
                        borderRadius: '1rem',
                        padding: '2rem',
                        marginBottom: '2rem',
                        textAlign: 'center'
                    }}>
                        <h2 style={{ color: passed ? '#065f46' : '#991b1b' }}>{passed ? '✅ ZALICZONY!' : '❌ NIEZALICZONY'}</h2>
                        <p style={{ fontSize: '3rem', fontWeight: 'bold', color: passed ? '#065f46' : '#991b1b', margin: '1rem 0' }}>
                            {quizResults.score_percentage}%
                        </p>
                        <p style={{ color: passed ? '#065f46' : '#991b1b' }}>Poprawne: {quizResults.correct_answers} / {quizResults.total_questions}</p>
                    </div>

                    <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem' }}>
                        <h3>📋 Szczegółowe Wyniki</h3>
                        {quizResults.results.map(result => (
                            <div key={result.question_id} style={{
                                padding: '1rem',
                                marginBottom: '0.75rem',
                                background: result.is_correct ? '#f0fdf4' : '#fef2f2',
                                border: `2px solid ${result.is_correct ? '#10b981' : '#ef4444'}`,
                                borderRadius: '0.5rem'
                            }}>
                                <strong>{result.question_id}. {result.question_text}</strong>
                                <div style={{ marginTop: '0.5rem', color: '#666' }}>
                                    Twoja odpowiedź: <strong>{result.user_answer || '(puste)'}</strong>
                                    {!result.is_correct && <> → Poprawna: <strong style={{ color: '#059669' }}>{result.correct_answer}</strong></>}
                                </div>
                                <div style={{ fontSize: '1.5rem' }}>{result.is_correct ? '✅' : '❌'}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                        <button onClick={() => router.push('/edu')} style={{
                            flex: 1,
                            padding: '1rem',
                            background: '#f3f4f6',
                            color: '#333',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}>← Powrót</button>
                        <button onClick={() => { setScreen('start'); setQuizResults(null) }} style={{
                            flex: 1,
                            padding: '1rem',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}>🔄 Spróbuj ponownie</button>
                    </div>
                </div>
            </div>
        )
    }

    return <div>Ładowanie...</div>
}
