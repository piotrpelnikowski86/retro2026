'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface Group {
    id: string
    code: string
    student_count: number
}

export default function GroupsManagement() {
    const { user, token } = useAuth()
    const router = useRouter()
    const [groups, setGroups] = useState<Group[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    // Create group form
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [newGroupCode, setNewGroupCode] = useState('')
    const [isCreating, setIsCreating] = useState(false)

    // Edit group form
    const [editingGroup, setEditingGroup] = useState<Group | null>(null)
    const [editGroupCode, setEditGroupCode] = useState('')
    const [isUpdating, setIsUpdating] = useState(false)

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
            } else {
                setError('Błąd podczas pobierania klas')
            }
        } catch (err) {
            setError('Błąd połączenia z serwerem')
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newGroupCode.trim()) return

        setIsCreating(true)
        setError('')

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/groups`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ code: newGroupCode.trim() })
            })

            if (response.ok) {
                setNewGroupCode('')
                setShowCreateForm(false)
                await fetchGroups()
            } else {
                const data = await response.json()
                setError(data.detail || 'Błąd podczas tworzenia klasy')
            }
        } catch (err) {
            setError('Błąd połączenia z serwerem')
        } finally {
            setIsCreating(false)
        }
    }

    const handleUpdateGroup = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingGroup || !editGroupCode.trim()) return

        setIsUpdating(true)
        setError('')

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/groups/${editingGroup.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ code: editGroupCode.trim() })
            })

            if (response.ok) {
                setEditingGroup(null)
                setEditGroupCode('')
                await fetchGroups()
            } else {
                const data = await response.json()
                setError(data.detail || 'Błąd podczas aktualizacji klasy')
            }
        } catch (err) {
            setError('Błąd połączenia z serwerem')
        } finally {
            setIsUpdating(false)
        }
    }

    const handleDeleteGroup = async (groupId: string, groupCode: string) => {
        if (!confirm(`Czy na pewno chcesz usunąć klasę "${groupCode}"?`)) {
            return
        }

        setError('')

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/groups/${groupId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok || response.status === 204) {
                await fetchGroups()
            } else {
                const data = await response.json()
                setError(data.detail || 'Błąd podczas usuwania klasy')
            }
        } catch (err) {
            setError('Błąd połączenia z serwerem')
        }
    }

    if (!user || user.role !== 'ADMIN') {
        return <div>Sprawdzanie uprawnień...</div>
    }

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
                        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>👥 Zarządzanie Klasami</h1>
                        <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
                            Tworzenie i edycja klas/grup
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

                {/* Actions */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '1rem'
                        }}
                    >
                        {showCreateForm ? '❌ Anuluj' : '➕ Dodaj Nową Klasę'}
                    </button>
                </div>

                {/* Create Form */}
                {showCreateForm && (
                    <div style={{
                        background: 'white',
                        borderRadius: '1rem',
                        padding: '1.5rem',
                        marginBottom: '1.5rem',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>Nowa Klasa</h3>
                        <form onSubmit={handleCreateGroup} style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#555', fontWeight: 'bold' }}>
                                    Kod Klasy (np. 2C)
                                </label>
                                <input
                                    type="text"
                                    value={newGroupCode}
                                    onChange={(e) => setNewGroupCode(e.target.value)}
                                    placeholder="np. 2C, 3A, 1B"
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
                            <button
                                type="submit"
                                disabled={isCreating}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: isCreating ? '#999' : '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: isCreating ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                {isCreating ? 'Tworzenie...' : 'Utwórz'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Groups List */}
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                        Ładowanie...
                    </div>
                ) : groups.length === 0 ? (
                    <div style={{
                        background: 'white',
                        borderRadius: '1rem',
                        padding: '2rem',
                        textAlign: 'center',
                        color: '#666'
                    }}>
                        Brak klas. Utwórz pierwszą klasę używając przycisku powyżej.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {groups.map((group) => (
                            <div
                                key={group.id}
                                style={{
                                    background: 'white',
                                    borderRadius: '1rem',
                                    padding: '1.5rem',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                {editingGroup?.id === group.id ? (
                                    // Edit Mode
                                    <form onSubmit={handleUpdateGroup} style={{ display: 'flex', gap: '1rem', flex: 1, alignItems: 'center' }}>
                                        <input
                                            type="text"
                                            value={editGroupCode}
                                            onChange={(e) => setEditGroupCode(e.target.value)}
                                            required
                                            style={{
                                                flex: 1,
                                                padding: '0.75rem',
                                                border: '2px solid #667eea',
                                                borderRadius: '0.5rem',
                                                fontSize: '1rem'
                                            }}
                                        />
                                        <button
                                            type="submit"
                                            disabled={isUpdating}
                                            style={{
                                                padding: '0.75rem 1rem',
                                                background: '#10b981',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '0.5rem',
                                                cursor: isUpdating ? 'not-allowed' : 'pointer',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            ✓ Zapisz
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingGroup(null)
                                                setEditGroupCode('')
                                            }}
                                            style={{
                                                padding: '0.75rem 1rem',
                                                background: '#666',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '0.5rem',
                                                cursor: 'pointer',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            ✗ Anuluj
                                        </button>
                                    </form>
                                ) : (
                                    // View Mode
                                    <>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#333' }}>
                                                {group.code}
                                            </h3>
                                            <p style={{ margin: '0.25rem 0 0 0', color: '#666' }}>
                                                Liczba uczniów: {group.student_count}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => {
                                                    setEditingGroup(group)
                                                    setEditGroupCode(group.code)
                                                }}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    background: '#667eea',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '0.5rem',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                ✏️ Edytuj
                                            </button>
                                            <button
                                                onClick={() => handleDeleteGroup(group.id, group.code)}
                                                disabled={group.student_count > 0}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    background: group.student_count > 0 ? '#ccc' : '#ef4444',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '0.5rem',
                                                    cursor: group.student_count > 0 ? 'not-allowed' : 'pointer',
                                                    fontWeight: 'bold'
                                                }}
                                                title={group.student_count > 0 ? 'Nie można usunąć klasy z uczniami' : 'Usuń klasę'}
                                            >
                                                🗑️ Usuń
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
