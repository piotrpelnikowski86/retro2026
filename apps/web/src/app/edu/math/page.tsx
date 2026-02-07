'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

type Tab = 'learning' | 'training' | 'column'
type Difficulty = 'easy' | 'medium' | 'hard'
type ColumnType = 'multiplication' | 'division'

interface Problem {
    operand1: number
    operand2: number
    answer: number
}

interface Statistics {
    total_attempts: number
    correct_count: number
    accuracy_percentage: number
    current_streak: number
    best_streak: number
    weakest_pairs: { operand1: number; operand2: number; error_count: number }[]
}

export default function MathLearning() {
    const { user, token } = useAuth()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<Tab>('learning')

    // Training state
    const [difficulty, setDifficulty] = useState<Difficulty>('medium')
    const [currentProblem, setCurrentProblem] = useState<Problem | null>(null)
    const [userAnswer, setUserAnswer] = useState('')
    const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null)
    const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0, streak: 0 })
    const [statistics, setStatistics] = useState<Statistics | null>(null)

    // Column math state
    const [columnType, setColumnType] = useState<ColumnType>('multiplication')
    const [columnProblem, setColumnProblem] = useState<Problem | null>(null)
    const [showSolution, setShowSolution] = useState(false)

    useEffect(() => {
        if (user && activeTab === 'training') {
            fetchStatistics()
        }
    }, [user, activeTab])

    const fetchStatistics = async () => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/math/statistics?exercise_type=multiplication`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            )
            if (response.ok) {
                const data = await response.json()
                setStatistics(data)
            }
        } catch (err) {
            console.error('Error fetching statistics')
        }
    }

    // ============= LEARNING TAB =============

    const renderLearningTab = () => {
        return (
            <div style={{ padding: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>📖 Tabliczka Mnożenia</h2>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{
                        borderCollapse: 'separate',
                        borderSpacing: '4px',
                        margin: '0 auto'
                    }}>
                        <thead>
                            <tr>
                                <th style={headerCellStyle}>×</th>
                                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                    <th key={num} style={headerCellStyle}>{num}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(row => (
                                <tr key={row}>
                                    <th style={headerCellStyle}>{row}</th>
                                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(col => {
                                        const result = row * col
                                        const color = getCellColor(row, col)
                                        return (
                                            <td
                                                key={col}
                                                style={{
                                                    ...tableCellStyle,
                                                    background: color,
                                                    cursor: 'pointer'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1.1)'
                                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1)'
                                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
                                                }}
                                                title={`${row} × ${col} = ${result}`}
                                            >
                                                <strong>{result}</strong>
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f4ff', borderRadius: '0.5rem', textAlign: 'center' }}>
                    <p style={{ margin: 0, color: '#666' }}>
                        💡 <strong>Wskazówka:</strong> Najedź kursorem na komórkę, aby zobaczyć równanie
                    </p>
                </div>
            </div>
        )
    }

    // ============= TRAINING TAB =============

    const generateProblem = (diff: Difficulty): Problem => {
        const ranges = {
            easy: { min: 2, max: 5 },
            medium: { min: 2, max: 7 },
            hard: { min: 2, max: 10 }
        }
        const range = ranges[diff]
        const operand1 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
        const operand2 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
        return { operand1, operand2, answer: operand1 * operand2 }
    }

    const startTraining = () => {
        setCurrentProblem(generateProblem(difficulty))
        setUserAnswer('')
        setFeedback(null)
    }

    const checkAnswer = async () => {
        if (!currentProblem || userAnswer === '') return

        const answer = parseInt(userAnswer)

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/math/attempts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    exercise_type: 'multiplication',
                    operand1: currentProblem.operand1,
                    operand2: currentProblem.operand2,
                    user_answer: answer
                })
            })

            if (response.ok) {
                const data = await response.json()
                const correct = data.is_correct

                setFeedback({
                    correct,
                    message: correct
                        ? '✅ Brawo! Poprawna odpowiedź!'
                        : `❌ Niepoprawnie. ${currentProblem.operand1} × ${currentProblem.operand2} = ${data.correct_answer}`
                })

                setSessionStats(prev => ({
                    correct: prev.correct + (correct ? 1 : 0),
                    total: prev.total + 1,
                    streak: correct ? prev.streak + 1 : 0
                }))

                // Refresh statistics
                fetchStatistics()
            }
        } catch (err) {
            console.error('Error saving attempt')
        }
    }

    const nextProblem = () => {
        setCurrentProblem(generateProblem(difficulty))
        setUserAnswer('')
        setFeedback(null)
    }

    const renderTrainingTab = () => {
        return (
            <div style={{ padding: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>🎯 Trening</h2>

                {/* Difficulty Selection */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Wybierz poziom:
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {(['easy', 'medium', 'hard'] as Difficulty[]).map(diff => (
                            <button
                                key={diff}
                                onClick={() => {
                                    setDifficulty(diff)
                                    setCurrentProblem(null)
                                    setFeedback(null)
                                }}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: difficulty === diff ? '#667eea' : '#f3f4f6',
                                    color: difficulty === diff ? 'white' : '#333',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                {diff === 'easy' ? 'Łatwy (2-5)' : diff === 'medium' ? 'Średni (2-7)' : 'Trudny (2-10)'}
                            </button>
                        ))}
                    </div>
                </div>

                {!currentProblem ? (
                    <button
                        onClick={startTraining}
                        style={{
                            padding: '1rem 2rem',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '1.2rem'
                        }}
                    >
                        🚀 Rozpocznij Trening
                    </button>
                ) : (
                    <div style={{
                        background: 'white',
                        borderRadius: '1rem',
                        padding: '2rem',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        maxWidth: '600px',
                        margin: '0 auto'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <p style={{ fontSize: '3rem', fontWeight: 'bold', color: '#333', margin: 0 }}>
                                {currentProblem.operand1} × {currentProblem.operand2} = ?
                            </p>
                        </div>

                        {!feedback ? (
                            <>
                                <input
                                    type="number"
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
                                    placeholder="Wpisz odpowiedź..."
                                    autoFocus
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        fontSize: '1.5rem',
                                        textAlign: 'center',
                                        border: '2px solid #ddd',
                                        borderRadius: '0.5rem',
                                        marginBottom: '1rem'
                                    }}
                                />
                                <button
                                    onClick={checkAnswer}
                                    disabled={userAnswer === ''}
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        background: userAnswer === '' ? '#ccc' : '#667eea',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        cursor: userAnswer === '' ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '1.1rem'
                                    }}
                                >
                                    Sprawdź
                                </button>
                            </>
                        ) : (
                            <>
                                <div style={{
                                    padding: '1.5rem',
                                    background: feedback.correct ? '#d1fae5' : '#fee',
                                    color: feedback.correct ? '#065f46' : '#991b1b',
                                    borderRadius: '0.5rem',
                                    marginBottom: '1rem',
                                    textAlign: 'center',
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold'
                                }}>
                                    {feedback.message}
                                </div>
                                <button
                                    onClick={nextProblem}
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        background: '#667eea',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '1.1rem'
                                    }}
                                >
                                    Następne →
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Session Statistics */}
                {sessionStats.total > 0 && (
                    <div style={{
                        marginTop: '2rem',
                        padding: '1.5rem',
                        background: '#f3f4f6',
                        borderRadius: '1rem',
                        maxWidth: '600px',
                        margin: '2rem auto 0'
                    }}>
                        <h3 style={{ margin: '0 0 1rem 0' }}>📊 Statystyki Sesji</h3>
                        <p style={{ margin: '0.5rem 0' }}>
                            Poprawne: {sessionStats.correct} / {sessionStats.total} ({Math.round(sessionStats.correct / sessionStats.total * 100)}%)
                        </p>
                        <p style={{ margin: '0.5rem 0' }}>
                            Aktualna seria: {sessionStats.streak} ✅
                        </p>
                    </div>
                )}

                {/* Overall Statistics */}
                {statistics && statistics.total_attempts > 0 && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '1.5rem',
                        background: 'white',
                        borderRadius: '1rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        maxWidth: '600px',
                        margin: '1rem auto 0'
                    }}>
                        <h3 style={{ margin: '0 0 1rem 0' }}>🏆 Statystyki Ogólne</h3>
                        <p style={{ margin: '0.5rem 0' }}>
                            Całkowita celność: {statistics.accuracy_percentage}%
                        </p>
                        <p style={{ margin: '0.5rem 0' }}>
                            Najlepsza seria: {statistics.best_streak}
                        </p>
                        {statistics.weakest_pairs.length > 0 && (
                            <>
                                <p style={{ margin: '1rem 0 0.5rem 0', fontWeight: 'bold' }}>
                                    Najsłabsze pary:
                                </p>
                                {statistics.weakest_pairs.map((pair, idx) => (
                                    <p key={idx} style={{ margin: '0.25rem 0', color: '#666' }}>
                                        {pair.operand1} × {pair.operand2} ({pair.error_count} błędów)
                                    </p>
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>
        )
    }

    // ============= COLUMN MATH TAB =============

    const generateColumnProblem = (type: ColumnType): Problem => {
        if (type === 'multiplication') {
            const num1 = Math.floor(Math.random() * 900) + 100  // 100-999
            const num2 = Math.floor(Math.random() * 90) + 10    // 10-99
            return { operand1: num1, operand2: num2, answer: num1 * num2 }
        } else {
            // Division: ensure no remainder
            const divisor = Math.floor(Math.random() * 9) + 2    // 2-10
            const quotient = Math.floor(Math.random() * 90) + 10 // 10-99
            const dividend = divisor * quotient
            return { operand1: dividend, operand2: divisor, answer: quotient }
        }
    }

    const newColumnProblem = () => {
        setColumnProblem(generateColumnProblem(columnType))
        setShowSolution(false)
    }

    const renderColumnTab = () => {
        return (
            <div style={{ padding: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>📊 Słupki - Mnożenie i Dzielenie</h2>

                {/* Type Selection */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Wybierz typ:
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => {
                                setColumnType('multiplication')
                                setColumnProblem(null)
                                setShowSolution(false)
                            }}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: columnType === 'multiplication' ? '#667eea' : '#f3f4f6',
                                color: columnType === 'multiplication' ? 'white' : '#333',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Mnożenie
                        </button>
                        <button
                            onClick={() => {
                                setColumnType('division')
                                setColumnProblem(null)
                                setShowSolution(false)
                            }}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: columnType === 'division' ? '#667eea' : '#f3f4f6',
                                color: columnType === 'division' ? 'white' : '#333',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Dzielenie
                        </button>
                    </div>
                </div>

                {!columnProblem ? (
                    <button
                        onClick={newColumnProblem}
                        style={{
                            padding: '1rem 2rem',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '1.2rem'
                        }}
                    >
                        Generuj Przykład
                    </button>
                ) : (
                    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '1rem',
                            padding: '2rem',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            marginBottom: '1rem'
                        }}>
                            <h3 style={{ margin: '0 0 1rem 0', textAlign: 'center' }}>
                                Przykład {columnType === 'multiplication' ? 'mnożenia' : 'dzielenia'}:
                            </h3>
                            <pre style={{
                                fontFamily: 'monospace',
                                fontSize: '1.5rem',
                                textAlign: 'right',
                                background: '#f9fafb',
                                padding: '1.5rem',
                                borderRadius: '0.5rem',
                                lineHeight: '2'
                            }}>
                                {columnType === 'multiplication' ? (
                                    <>
                                        {columnProblem.operand1}{'\n'}
                                        × {columnProblem.operand2}{'\n'}
                                        {'─'.repeat(10)}
                                    </>
                                ) : (
                                    `${columnProblem.operand1} ÷ ${columnProblem.operand2} = ?`
                                )}
                            </pre>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                <button
                                    onClick={() => setShowSolution(!showSolution)}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        background: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {showSolution ? 'Ukryj rozwiązanie' : 'Pokaż rozwiązanie'}
                                </button>
                                <button
                                    onClick={newColumnProblem}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        background: '#667eea',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Nowy przykład
                                </button>
                            </div>
                        </div>

                        {showSolution && (
                            <div style={{
                                background: '#d1fae5',
                                borderRadius: '1rem',
                                padding: '1.5rem',
                                border: '2px solid #10b981'
                            }}>
                                <h4 style={{ margin: '0 0 1rem 0', color: '#065f46' }}>✅ Rozwiązanie:</h4>
                                <pre style={{
                                    fontFamily: 'monospace',
                                    fontSize: '1.2rem',
                                    color: '#065f46',
                                    margin: 0,
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {columnType === 'multiplication' ? (
                                        `Odpowiedź: ${columnProblem.answer}`
                                    ) : (
                                        `${columnProblem.operand1} ÷ ${columnProblem.operand2} = ${columnProblem.answer}`
                                    )}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )
    }

    // ============= RENDER =============

    if (!user) {
        return <div>Ładowanie...</div>
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'system-ui, sans-serif' }}>
            <header style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '1.5rem 2rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>🔢 Matematyka - Tabliczka Mnożenia</h1>
                        <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
                            Nauka, trening i praktyka
                        </p>
                    </div>
                    <button onClick={() => router.push('/edu')} style={{
                        padding: '0.75rem 1.5rem',
                        background: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}>
                        ← Powrót
                    </button>
                </div>
            </header>

            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem 2rem 0', borderBottom: '2px solid #e5e7eb' }}>
                    {[
                        { id: 'learning' as Tab, label: '📖 Nauka', icon: '📖' },
                        { id: 'training' as Tab, label: '🎯 Trening', icon: '🎯' },
                        { id: 'column' as Tab, label: '📊 Słupki', icon: '📊' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '1rem 2rem',
                                background: activeTab === tab.id ? 'white' : 'transparent',
                                color: activeTab === tab.id ? '#667eea' : '#666',
                                border: 'none',
                                borderBottom: activeTab === tab.id ? '3px solid #667eea' : '3px solid transparent',
                                cursor: 'pointer',
                                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                                fontSize: '1rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div style={{ background: 'white', minHeight: '500px' }}>
                    {activeTab === 'learning' && renderLearningTab()}
                    {activeTab === 'training' && renderTrainingTab()}
                    {activeTab === 'column' && renderColumnTab()}
                </div>
            </div>
        </div>
    )
}

// ============= STYLES =============

const headerCellStyle: React.CSSProperties = {
    padding: '1rem',
    background: '#667eea',
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    borderRadius: '0.5rem'
}

const tableCellStyle: React.CSSProperties = {
    padding: '1rem',
    textAlign: 'center',
    borderRadius: '0.5rem',
    fontSize: '1.2rem',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
}

function getCellColor(row: number, col: number): string {
    const max = Math.max(row, col)
    if (max <= 5) return '#d1fae5'  // Green - easy
    if (max <= 7) return '#fef3c7'  // Yellow - medium
    return '#fee2e2'                 // Red - hard
}
