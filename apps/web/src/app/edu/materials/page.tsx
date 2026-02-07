'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface Material {
    id: string
    title: string
    description: string | null
    content: string | null
    tags: string[]
    created_at: string
}

export default function StudentMaterials() {
    const { user, token } = useAuth()
    const router = useRouter()
    const [materials, setMaterials] = useState<Material[]>([])
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [tagFilter, setTagFilter] = useState('')
    const [allTags, setAllTags] = useState<string[]>([])

    useEffect(() => {
        if (user) {
            fetchMaterials()
        }
    }, [user, tagFilter])

    const fetchMaterials = async () => {
        try {
            let url = `${process.env.NEXT_PUBLIC_API_URL}/materials`
            if (tagFilter) {
                url += `?tag=${tagFilter}`
            }

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (response.ok) {
                const data = await response.json()
                setMaterials(data)

                // Extract unique tags
                const tags = new Set<string>()
                data.forEach((m: Material) => {
                    m.tags.forEach(tag => tags.add(tag))
                })
                setAllTags(Array.from(tags).sort())
            } else {
                setError('Błąd przy pobieraniu materiałów')
            }
        } catch (err) {
            setError('Błąd połączenia z serwerem')
        } finally {
            setIsLoading(false)
        }
    }

    const viewMaterial = async (materialId: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/materials/${materialId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (response.ok) {
                const data = await response.json()
                setSelectedMaterial(data)
            } else {
                setError('Nie masz dostępu do tego materiału')
            }
        } catch (err) {
            setError('Błąd połączenia z serwerem')
        }
    }

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
                        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>📚 Materiały Edukacyjne</h1>
                        <p style={{
                            margin: '0.5rem 0 0 0', opacity: 0.9
                        }}>
                            Przeglądaj i ucz się
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
                        ← Powrót do panelu
                    </button>
                </div>
            </header >

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
                {error && (
                    <div style={{
                        padding: '1rem',
                        marginBottom: '1rem',
                        background: '#fee',
                        color: '#c33',
                        borderRadius: '0.5rem'
                    }}>
                        {error}
                    </div>
                )}

                {selectedMaterial ? (
                    // Material Detail View
                    <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <button
                            onClick={() => setSelectedMaterial(null)}
                            style={{
                                padding: '0.5rem 1rem',
                                background: '#f3f4f6',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                marginBottom: '1.5rem',
                                fontWeight: 'bold'
                            }}
                        >
                            ← Wróć do listy
                        </button>

                        <h1 style={{ margin: '0 0 1rem 0', color: '#333' }}>{selectedMaterial.title}</h1>

                        {selectedMaterial.description && (
                            <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '1.5rem' }}>
                                {selectedMaterial.description}
                            </p>
                        )}

                        <div style={{ marginBottom: '1.5rem' }}>
                            {selectedMaterial.tags.map((tag, idx) => (
                                <span key={idx} style={{
                                    display: 'inline-block',
                                    background: '#e0e7ff',
                                    color: '#4f46e5',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '1rem',
                                    fontSize: '0.85rem',
                                    marginRight: '0.5rem',
                                    marginBottom: '0.5rem'
                                }}>
                                    #{tag}
                                </span>
                            ))}
                        </div>

                        {selectedMaterial.content && (
                            <div style={{
                                padding: '1.5rem',
                                background: '#f9fafb',
                                borderRadius: '0.5rem',
                                whiteSpace: 'pre-wrap',
                                lineHeight: '1.8',
                                color: '#333'
                            }}>
                                {selectedMaterial.content}
                            </div>
                        )}
                    </div>
                ) : (
                    // Materials List View
                    <>
                        {allTags.length > 0 && (
                            <div style={{
                                marginBottom: '1.5rem',
                                padding: '1rem',
                                background: 'white',
                                borderRadius: '0.5rem',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                    Filtruj po tagu:
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => setTagFilter('')}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            background: tagFilter === '' ? '#667eea' : '#f3f4f6',
                                            color: tagFilter === '' ? 'white' : '#333',
                                            border: 'none',
                                            borderRadius: '0.5rem',
                                            cursor: 'pointer',
                                            fontWeight: tagFilter === '' ? 'bold' : 'normal'
                                        }}
                                    >
                                        Wszystkie
                                    </button>
                                    {allTags.map((tag, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setTagFilter(tag)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: tagFilter === tag ? '#667eea' : '#f3f4f6',
                                                color: tagFilter === tag ? 'white' : '#333',
                                                border: 'none',
                                                borderRadius: '0.5rem',
                                                cursor: 'pointer',
                                                fontWeight: tagFilter === tag ? 'bold' : 'normal'
                                            }}
                                        >
                                            #{tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isLoading ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                Ładowanie...
                            </div>
                        ) : materials.length === 0 ? (
                            <div style={{
                                background: 'white',
                                borderRadius: '1rem',
                                padding: '2rem',
                                textAlign: 'center',
                                color: '#666'
                            }}>
                                Brak dostępnych materiałów.
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                {materials.map((material) => (
                                    <div
                                        key={material.id}
                                        onClick={() => viewMaterial(material.id)}
                                        style={{
                                            background: 'white',
                                            borderRadius: '1rem',
                                            padding: '1.5rem',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            border: '2px solid transparent'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)'
                                            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)'
                                            e.currentTarget.style.borderColor = '#667eea'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)'
                                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
                                            e.currentTarget.style.borderColor = 'transparent'
                                        }}
                                    >
                                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#333' }}>
                                            {material.title}
                                        </h3>
                                        {material.description && (
                                            <p style={{
                                                margin: '0 0 1rem 0',
                                                color: '#666',
                                                fontSize: '0.9rem',
                                                lineHeight: '1.5',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden'
                                            }}>
                                                {material.description}
                                            </p>
                                        )}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                            {material.tags.map((tag, idx) => (
                                                <span key={idx} style={{
                                                    background: '#e0e7ff',
                                                    color: '#4f46e5',
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '0.25rem',
                                                    fontSize: '0.75rem'
                                                }}>
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div >
    )
}
