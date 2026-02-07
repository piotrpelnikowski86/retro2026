'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface Material {
    id: string
    title: string
    description: string | null
    content: string | null
    status: 'draft' | 'published'
    tags: string[]
    target_classes: string[] | null
    file_url: string | null
    file_type: string | null
    created_at: string
}

interface Group {
    id: string
    code: string
}

export default function MaterialsManagement() {
    const { user, token } = useAuth()
    const router = useRouter()
    const [materials, setMaterials] = useState<Material[]>([])
    const [groups, setGroups] = useState<Group[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')

    // Create/Edit form
    const [showForm, setShowForm] = useState(false)
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
    const [formTitle, setFormTitle] = useState('')
    const [formDescription, setFormDescription] = useState('')
    const [formContent, setFormContent] = useState('')
    const [formStatus, setFormStatus] = useState<'draft' | 'published'>('draft')
    const [formTags, setFormTags] = useState('')
    const [formTargetClasses, setFormTargetClasses] = useState<string[]>([])
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (user && user.role !== 'ADMIN') {
            router.push('/edu')
        }
    }, [user, router])

    useEffect(() => {
        if (user && user.role === 'ADMIN') {
            fetchMaterials()
            fetchGroups()
        }
    }, [user, statusFilter])

    const fetchGroups = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/groups`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setGroups(data)
            }
        } catch (err) {
            console.error('Error fetching groups')
        }
    }

    const fetchMaterials = async () => {
        try {
            let url = `${process.env.NEXT_PUBLIC_API_URL}/admin/materials`
            if (statusFilter !== 'all') {
                url += `?status_filter=${statusFilter}`
            }

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setMaterials(data)
            }
        } catch (err) {
            setError('Błąd przy pobieraniu materiałów')
        } finally {
            setIsLoading(false)
        }
    }

    const resetForm = () => {
        setFormTitle('')
        setFormDescription('')
        setFormContent('')
        setFormStatus('draft')
        setFormTags('')
        setFormTargetClasses([])
        setEditingMaterial(null)
        setShowForm(false)
    }

    const openCreateForm = () => {
        resetForm()
        setShowForm(true)
    }

    const openEditForm = (material: Material) => {
        setEditingMaterial(material)
        setFormTitle(material.title)
        setFormDescription(material.description || '')
        setFormContent(material.content || '')
        setFormStatus(material.status)
        setFormTags(material.tags.join(', '))
        setFormTargetClasses(material.target_classes || [])
        setShowForm(true)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setError('')

        const tags = formTags.split(',').map(t => t.trim()).filter(t => t.length > 0)
        const body = {
            title: formTitle,
            description: formDescription || null,
            content: formContent || null,
            status: formStatus,
            tags,
            target_classes: formTargetClasses.length > 0 ? formTargetClasses : null
        }

        try {
            const url = editingMaterial
                ? `${process.env.NEXT_PUBLIC_API_URL}/admin/materials/${editingMaterial.id}`
                : `${process.env.NEXT_PUBLIC_API_URL}/admin/materials`

            const response = await fetch(url, {
                method: editingMaterial ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            })

            if (response.ok) {
                resetForm()
                await fetchMaterials()
            } else {
                const data = await response.json()
                setError(data.detail || 'Błąd podczas zapisywania')
            }
        } catch (err) {
            setError('Błąd połączenia z serwerem')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (materialId: string, title: string) => {
        if (!confirm(`Czy na pewno chcesz usunąć materiał "${title}"?`)) {
            return
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/materials/${materialId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (response.ok || response.status === 204) {
                await fetchMaterials()
            } else {
                setError('Błąd podczas usuwania')
            }
        } catch (err) {
            setError('Błąd połączenia z serwerem')
        }
    }

    const toggleClassSelection = (code: string) => {
        setFormTargetClasses(prev =>
            prev.includes(code)
                ? prev.filter(c => c !== code)
                : [...prev, code]
        )
    }

    if (!user || user.role !== 'ADMIN') {
        return <div>Sprawdzanie uprawnień...</div>
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
                        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>📚 Zarządzanie Materiałami</h1>
                        <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
                            Tworzenie i publikacja materiałów edukacyjnych
                        </p>
                    </div>
                    <button onClick={() => router.push('/admin')} style={{
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

                {!showForm && (
                    <>
                        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <button onClick={openCreateForm} style={{
                                padding: '0.75rem 1.5rem',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}>
                                ➕ Nowy Materiał
                            </button>

                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{
                                padding: '0.75rem',
                                border: '2px solid #ddd',
                                borderRadius: '0.5rem',
                                fontSize: '1rem'
                            }}>
                                <option value="all">Wszystkie</option>
                                <option value="draft">Szkice</option>
                                <option value="published">Opublikowane</option>
                            </select>
                        </div>

                        {isLoading ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>Ładowanie...</div>
                        ) : materials.length === 0 ? (
                            <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', textAlign: 'center' }}>
                                Brak materiałów. Utwórz pierwszy materiał.
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {materials.map((material) => (
                                    <div key={material.id} style={{
                                        background: 'white',
                                        borderRadius: '1rem',
                                        padding: '1.5rem',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#333' }}>
                                                    {material.title}
                                                    {material.status === 'draft' && (
                                                        <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#f59e0b', background: '#fef3c7', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                                                            SZKIC
                                                        </span>
                                                    )}
                                                    {material.status === 'published' && (
                                                        <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#10b981', background: '#d1fae5', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                                                            OPUBLIKOWANE
                                                        </span>
                                                    )}
                                                </h3>
                                                {material.description && (
                                                    <p style={{ margin: '0.5rem 0', color: '#666' }}>{material.description}</p>
                                                )}
                                                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    {material.tags.map((tag, idx) => (
                                                        <span key={idx} style={{
                                                            background: '#e0e7ff',
                                                            color: '#4f46e5',
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: '1rem',
                                                            fontSize: '0.85rem'
                                                        }}>
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                    {material.target_classes && material.target_classes.length > 0 && (
                                                        <span style={{
                                                            background: '#fce7f3',
                                                            color: '#9d174d',
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: '1rem',
                                                            fontSize: '0.85rem'
                                                        }}>
                                                            Klasy: {material.target_classes.join(', ')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                                                <button onClick={() => openEditForm(material)} style={{
                                                    padding: '0.5rem 1rem',
                                                    background: '#667eea',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '0.5rem',
                                                    cursor: 'pointer'
                                                }}>
                                                    ✏️ Edytuj
                                                </button>
                                                <button onClick={() => handleDelete(material.id, material.title)} style={{
                                                    padding: '0.5rem 1rem',
                                                    background: '#ef4444',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '0.5rem',
                                                    cursor: 'pointer'
                                                }}>
                                                    🗑️ Usuń
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {showForm && (
                    <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <h2 style={{ margin: '0 0 1.5rem 0' }}>
                            {editingMaterial ? 'Edytuj Materiał' : 'Nowy Materiał'}
                        </h2>

                        <form onSubmit={handleSave} style={{ display: 'grid', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                    Tytuł *
                                </label>
                                <input
                                    type="text"
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #ddd',
                                        borderRadius: '0.5rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                    Opis
                                </label>
                                <textarea
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #ddd',
                                        borderRadius: '0.5rem',
                                        fontFamily: 'inherit'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                    Treść
                                </label>
                                <textarea
                                    value={formContent}
                                    onChange={(e) => setFormContent(e.target.value)}
                                    rows={10}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #ddd',
                                        borderRadius: '0.5rem',
                                        fontFamily: 'monospace'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                    Status
                                </label>
                                <select
                                    value={formStatus}
                                    onChange={(e) => setFormStatus(e.target.value as 'draft' | 'published')}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #ddd',
                                        borderRadius: '0.5rem'
                                    }}
                                >
                                    <option value="draft">Szkic</option>
                                    <option value="published">Opublikowane</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                    Tagi (oddzielone przecinkiem)
                                </label>
                                <input
                                    type="text"
                                    value={formTags}
                                    onChange={(e) => setFormTags(e.target.value)}
                                    placeholder="np. matematyka, klasa 2, geometria"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #ddd',
                                        borderRadius: '0.5rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                    Dla klas (zostaw puste = wszystkie klasy)
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {groups.map((group) => (
                                        <label key={group.id} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '0.5rem 1rem',
                                            background: formTargetClasses.includes(group.code) ? '#e0e7ff' : '#f3f4f6',
                                            border: `2px solid ${formTargetClasses.includes(group.code) ? '#4f46e5' : '#d1d5db'}`,
                                            borderRadius: '0.5rem',
                                            cursor: 'pointer'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={formTargetClasses.includes(group.code)}
                                                onChange={() => toggleClassSelection(group.code)}
                                                style={{ marginRight: '0.5rem' }}
                                            />
                                            {group.code}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    style={{
                                        padding: '1rem 2rem',
                                        background: isSaving ? '#999' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        cursor: isSaving ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {isSaving ? 'Zapisywanie...' : 'Zapisz'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    style={{
                                        padding: '1rem 2rem',
                                        background: '#999',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Anuluj
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}
