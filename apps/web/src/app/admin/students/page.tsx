'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface Group {
    id: string
    code: string
    student_count: number
}

interface Student {
    username: string
    password: string
    is_new: boolean
}

export default function StudentsManagement() {
    const { user, token } = useAuth()
    const router = useRouter()
    const [groups, setGroups] = useState<Group[]>([])
    const [selectedGroupId, setSelectedGroupId] = useState('')
    const [startNumber, setStartNumber] = useState(1)
    const [endNumber, setEndNumber] = useState(28)
    const [defaultPassword, setDefaultPassword] = useState('password123')
    const [isCreating, setIsCreating] = useState(false)
    const [createdStudents, setCreatedStudents] = useState<Student[]>([])
    const [createResult, setCreateResult] = useState<{ created: number, skipped: number } | null>(null)
    const [error, setError] = useState('')

    // Redirect if not admin
    useEffect(() => {
        if (user && user.role !== 'ADMIN') {
            router.push('/edu')
        }
    }, [user, router])

    useEffect(() => {
        if (user && user.role === 'ADMIN') {
            fetchGroups()
        }
    }, [user])

    const fetchGroups = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/groups`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setGroups(data)
            }
        } catch (err) {
            console.error('Error fetching groups')
        }
    }

    const handleBulkCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedGroupId) {
            setError('Wybierz klasę')
            return
        }

        setIsCreating(true)
        setError('')
        setCreatedStudents([])
        setCreateResult(null)

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/students/bulk-create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    group_id: selectedGroupId,
                    start_number: startNumber,
                    end_number: endNumber,
                    default_password: defaultPassword
                })
            })

            if (response.ok) {
                const data = await response.json()
                setCreatedStudents(data.students)
                setCreateResult({
                    created: data.created_count,
                    skipped: data.skipped_count
                })
                await fetchGroups() // Refresh group counts
            } else {
                const data = await response.json()
                setError(data.detail || 'Błąd podczas tworzenia uczniów')
            }
        } catch (err) {
            setError('Błąd połączenia z serwerem')
        } finally {
            setIsCreating(false)
        }
    }

    const handleExportCSV = () => {
        if (!selectedGroupId) {
            alert('Wybierz klasę')
            return
        }

        const url = `${process.env.NEXT_PUBLIC_API_URL}/admin/students/export.csv?group_id=${selectedGroupId}`
        window.open(url + `&token=${token}`, '_blank')
    }

    const downloadNewStudentsCSV = () => {
        const newStudents = createdStudents.filter(s => s.is_new)
        if (newStudents.length === 0) {
            alert('Brak nowych uczniów do eksportu')
            return
        }

        const csvContent = [
            ['Login', 'Hasło'],
            ...newStudents.map(s => [s.username, s.password])
        ].map(row => row.join(',')).join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `nowi_uczniowie_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
    }

    if (!user || user.role !== 'ADMIN') {
        return <div>Sprawdzanie uprawnień...</div>
    }

    const selectedGroup = groups.find(g => g.id === selectedGroupId)

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'system-ui, sans-serif' }}>
            {/* Header */}
            <header style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '1.5rem 2rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>🎓 Zarządzanie Uczniami</h1>
                        <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
                            Hurtowe tworzenie kont uczniów
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/admin')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        ← Powrót
                    </button>
                </div>
            </header>

            {/* Content */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
                {/* Error Message */}
                {error && (
                    <div style={{
                        padding: '1rem',
                        marginBottom: '1rem',
                        background: '#fee',
                        color: '#c33',
                        borderRadius: '0.5rem',
                        border: '1px solid #fcc'
                    }}>
                        {error}
                    </div>
                )}

                {/* Bulk Create Form */}
                <div style={{
                    background: 'white',
                    borderRadius: '1rem',
                    padding: '2rem',
                    marginBottom: '1.5rem',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    <h2 style={{ margin: '0 0 1.5rem 0', color: '#333' }}>Hurtowe Tworzenie Uczniów</h2>

                    <form onSubmit={handleBulkCreate} style={{ display: 'grid', gap: '1.5rem' }}>
                        {/* Group Selection */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#555', fontWeight: 'bold' }}>
                                Wybierz Klasę
                            </label>
                            <select
                                value={selectedGroupId}
                                onChange={(e) => setSelectedGroupId(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '2px solid #ddd',
                                    borderRadius: '0.5rem',
                                    fontSize: '1rem'
                                }}
                            >
                                <option value="">-- Wybierz klasę --</option>
                                {groups.map(group => (
                                    <option key={group.id} value={group.id}>
                                        {group.code} ({group.student_count} uczniów)
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Number Range */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#555', fontWeight: 'bold' }}>
                                    Numer Od
                                </label>
                                <input
                                    type="number"
                                    value={startNumber}
                                    onChange={(e) => setStartNumber(parseInt(e.target.value))}
                                    min="1"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #ddd',
                                        borderRadius: '0.5rem',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#555', fontWeight: 'bold' }}>
                                    Numer Do
                                </label>
                                <input
                                    type="number"
                                    value={endNumber}
                                    onChange={(e) => setEndNumber(parseInt(e.target.value))}
                                    min={startNumber}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #ddd',
                                        borderRadius: '0.5rem',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Default Password */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#555', fontWeight: 'bold' }}>
                                Domyślne Hasło
                            </label>
                            <input
                                type="text"
                                value={defaultPassword}
                                onChange={(e) => setDefaultPassword(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '2px solid #ddd',
                                    borderRadius: '0.5rem',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        {/* Preview */}
                        {selectedGroup && (
                            <div style={{
                                padding: '1rem',
                                background: '#f0f4ff',
                                borderRadius: '0.5rem',
                                border: '2px solid #667eea'
                            }}>
                                <p style={{ margin: 0, color: '#333', fontWeight: 'bold' }}>📝 Podgląd:</p>
                                <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
                                    Utworzone zostaną konta: <strong>{selectedGroup.code}-{startNumber}</strong> do <strong>{selectedGroup.code}-{endNumber}</strong>
                                    <br />
                                    Format loginu: <strong>{selectedGroup.code}-15</strong> (bez zer wiodących!)
                                    <br />
                                    Liczba kont: <strong>{endNumber - startNumber + 1}</strong>
                                </p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isCreating}
                            style={{
                                padding: '1rem 2rem',
                                background: isCreating ? '#999' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: isCreating ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold',
                                fontSize: '1.1rem'
                            }}
                        >
                            {isCreating ? '⏳ Tworzenie...' : '✅ Utwórz Uczniów'}
                        </button>
                    </form>
                </div>

                {/* Results */}
                {createResult && (
                    <div style={{
                        background: 'white',
                        borderRadius: '1rem',
                        padding: '2rem',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>✅ Wynik Tworzenia</h3>
                        <div style={{ marginBottom: '1rem' }}>
                            <p style={{ margin: '0.25rem 0', color: '#10b981', fontWeight: 'bold' }}>
                                ✓ Utworzono: {createResult.created} nowych kont
                            </p>
                            <p style={{ margin: '0.25rem 0', color: '#f59e0b' }}>
                                ⚠ Pominięto: {createResult.skipped} (już istnieją)
                            </p>
                        </div>

                        {createdStudents.filter(s => s.is_new).length > 0 && (
                            <>
                                <button
                                    onClick={downloadNewStudentsCSV}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        background: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        marginBottom: '1rem'
                                    }}
                                >
                                    📥 Pobierz CSV (tylko nowi uczniowie)
                                </button>

                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                                                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Login</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Hasło</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {createdStudents.map((student, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontWeight: 'bold' }}>
                                                        {student.username}
                                                    </td>
                                                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: student.is_new ? '#10b981' : '#999' }}>
                                                        {student.password}
                                                    </td>
                                                    <td style={{ padding: '0.75rem' }}>
                                                        {student.is_new ? (
                                                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ NOWY</span>
                                                        ) : (
                                                            <span style={{ color: '#f59e0b' }}>⊘ Istnieje</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
