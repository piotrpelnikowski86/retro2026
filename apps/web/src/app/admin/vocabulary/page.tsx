'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface Vocabulary {
    id: string
    english_word: string
    polish_translation: string
    category: string | null
    difficulty_level: string | null
}

export default function VocabularyManagement() {
    const { user, token } = useAuth()
    const router = useRouter()

    const [vocabularyList, setVocabularyList] = useState<Vocabulary[]>([])
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        english_word: '',
        polish_translation: '',
        category: '',
        difficulty_level: 'medium'
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (user) fetchVocabulary()
    }, [user])

    const fetchVocabulary = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/vocabulary`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setVocabularyList(data)
            }
        } catch (err) {
            setError('Błąd pobierania słówek')
        }
    }

    const handleSave = async () => {
        try {
            setIsLoading(true)
            const url = editingId
                ? `${process.env.NEXT_PUBLIC_API_URL}/admin/vocabulary/${editingId}`
                : `${process.env.NEXT_PUBLIC_API_URL}/admin/vocabulary`

            const response = await fetch(url, {
                method: editingId ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                fetchVocabulary()
                setShowForm(false)
                resetForm()
            }
        } catch (err) {
            setError('Błąd zapisu')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Czy na pewno usunąć to słówko?')) return

        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/vocabulary/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            fetchVocabulary()
        } catch (err) {
            setError('Błąd usuwania')
        }
    }

    const openCreateForm = () => {
        resetForm()
        setShowForm(true)
    }

    const openEditForm = (vocab: Vocabulary) => {
        setEditingId(vocab.id)
        setFormData({
            english_word: vocab.english_word,
            polish_translation: vocab.polish_translation,
            category: vocab.category || '',
            difficulty_level: vocab.difficulty_level || 'medium'
        })
        setShowForm(true)
    }

    const resetForm = () => {
        setEditingId(null)
        setFormData({ english_word: '', polish_translation: '', category: '', difficulty_level: 'medium' })
    }

    if (!user) return <div>Ładowanie...</div>

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
            <header style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '1.5rem 2rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between' }}>
                    <h1 style={{ margin: 0 }}>📚 Zarządzanie Słówkami</h1>
                    <button onClick={() => router.push('/admin')} style={{
                        padding: '0.75rem 1.5rem',
                        background: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer'
                    }}>← Powrót</button>
                </div>
            </header>

            <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem' }}>
                {error && <div style={{ padding: '1rem', background: '#fee', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem' }}>{error}</div>}

                {!showForm ? (
                    <>
                        <button onClick={openCreateForm} style={{
                            marginBottom: '1.5rem',
                            padding: '0.75rem 1.5rem',
                            background: '#667eea',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}>➕ Dodaj Słówko</button>

                        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            <h2>Lista Słówek ({vocabularyList.length})</h2>
                            {vocabularyList.map(v => (
                                <div key={v.id} style={{
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                    background: '#f9fafb',
                                    borderRadius: '0.5rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <strong>{v.english_word}</strong> → {v.polish_translation}
                                        {v.category && <span style={{ marginLeft: '1rem', color: '#666' }}>({v.category})</span>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => openEditForm(v)} style={{
                                            padding: '0.5rem 1rem',
                                            background: '#667eea',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '0.25rem',
                                            cursor: 'pointer'
                                        }}>✏️ Edytuj</button>
                                        <button onClick={() => handleDelete(v.id)} style={{
                                            padding: '0.5rem 1rem',
                                            background: '#ef4444',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '0.25rem',
                                            cursor: 'pointer'
                                        }}>🗑️ Usuń</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <h2>{editingId ? 'Edytuj' : 'Dodaj'} Słówko</h2>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Angielskie słowo</label>
                            <input type="text" value={formData.english_word} onChange={e => setFormData({ ...formData, english_word: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '0.25rem' }} />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Polskie tłumaczenie</label>
                            <input type="text" value={formData.polish_translation} onChange={e => setFormData({ ...formData, polish_translation: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '0.25rem' }} />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Kategoria (opcjonalne)</label>
                            <input type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                                placeholder="np. animals, colors"
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '0.25rem' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={handleSave} disabled={isLoading || !formData.english_word || !formData.polish_translation}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: isLoading || !formData.english_word || !formData.polish_translation ? '#ccc' : '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: isLoading || !formData.english_word || !formData.polish_translation ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold'
                                }}>{isLoading ? 'Zapisywanie...' : 'Zapisz'}</button>
                            <button onClick={() => { setShowForm(false); resetForm() }}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: '#f3f4f6',
                                    color: '#333',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer'
                                }}>Anuluj</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
