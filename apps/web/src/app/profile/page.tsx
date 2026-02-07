'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface Avatar {
    id: string
    name: string
    path: string
    description: string
}

export default function ProfilePage() {
    const { user, token } = useAuth()
    const router = useRouter()
    const [avatars, setAvatars] = useState<Avatar[]>([])
    const [selectedAvatar, setSelectedAvatar] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        fetchAvatars()
        if (user) {
            setSelectedAvatar(user.avatar_preset_id)
        }
    }, [user])

    const fetchAvatars = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/avatars`)
            const data = await response.json()
            setAvatars(data.avatars)
        } catch (error) {
            console.error('Failed to fetch avatars:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSaveAvatar = async () => {
        if (!selectedAvatar || selectedAvatar === user?.avatar_preset_id) {
            return
        }

        setIsSaving(true)
        setMessage('')

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me/avatar`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ avatar_preset_id: selectedAvatar })
            })

            if (response.ok) {
                setMessage('Avatar zaktualizowany pomyślnie! ✅')
                // Refresh user data
                window.location.reload()
            } else {
                setMessage('Błąd podczas aktualizacji avatara ❌')
            }
        } catch (error) {
            setMessage('Błąd połączenia z serwerem ❌')
        } finally {
            setIsSaving(false)
        }
    }

    if (!user) {
        return <div>Loading...</div>
    }

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ margin: 0, color: '#333' }}>👤 Profil użytkownika</h1>
                    <p style={{ color: '#666', marginTop: '0.5rem' }}>Personalizuj swój profil wybierając avatar</p>
                </div>

                <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '0.5rem' }}>
                    <p style={{ margin: 0, color: '#555' }}>
                        <strong>Nazwa użytkownika:</strong> {user.username}
                    </p>
                    <p style={{ margin: '0.5rem 0 0 0', color: '#555' }}>
                        <strong>Rola:</strong> {user.role}
                    </p>
                </div>

                <h2 style={{ marginTop: '2rem', marginBottom: '1rem', color: '#333' }}>Wybierz avatar</h2>

                {isLoading ? (
                    <p>Ładowanie avatarów...</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        {avatars.map((avatar) => (
                            <div
                                key={avatar.id}
                                onClick={() => setSelectedAvatar(avatar.id)}
                                style={{
                                    padding: '1rem',
                                    border: selectedAvatar === avatar.id ? '3px solid #667eea' : '2px solid #ddd',
                                    borderRadius: '0.75rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    background: selectedAvatar === avatar.id ? '#f0f4ff' : 'white',
                                    boxShadow: selectedAvatar === avatar.id ? '0 4px 12px rgba(102, 126, 234, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                                    textAlign: 'center'
                                }}
                            >
                                <img
                                    src={avatar.path}
                                    alt={avatar.name}
                                    style={{ width: '100%', height: 'auto', borderRadius: '0.5rem', marginBottom: '0.5rem' }}
                                />
                                <p style={{ margin: 0, fontWeight: 'bold', color: '#333', fontSize: '0.9rem' }}>{avatar.name}</p>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#666' }}>{avatar.description}</p>
                            </div>
                        ))}
                    </div>
                )}

                {message && (
                    <div style={{
                        padding: '1rem',
                        marginBottom: '1rem',
                        background: message.includes('✅') ? '#d4edda' : '#f8d7da',
                        color: message.includes('✅') ? '#155724' : '#721c24',
                        borderRadius: '0.5rem'
                    }}>
                        {message}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={handleSaveAvatar}
                        disabled={isSaving || selectedAvatar === user.avatar_preset_id}
                        style={{
                            flex: 1,
                            padding: '1rem',
                            background: (isSaving || selectedAvatar === user.avatar_preset_id) ? '#999' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            cursor: (isSaving || selectedAvatar === user.avatar_preset_id) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isSaving ? 'Zapisywanie...' : 'Zapisz avatar'}
                    </button>
                    <button
                        onClick={() => router.push('/edu')}
                        style={{
                            flex: 1,
                            padding: '1rem',
                            background: 'white',
                            color: '#667eea',
                            border: '2px solid #667eea',
                            borderRadius: '0.5rem',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Powrót do panelu
                    </button>
                </div>
            </div>
        </div>
    )
}
