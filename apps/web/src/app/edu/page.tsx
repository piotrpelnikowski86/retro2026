'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function EduDashboard() {
    const { user, logout } = useAuth()
    const router = useRouter()

    if (!user) {
        return <div>Loading...</div>
    }

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                padding: '1rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '0.5rem'
            }}>
                <div>
                    <h1 style={{ margin: 0 }}>🎓 Tymonteam.pl</h1>
                    <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
                        Witaj, {user.username}!
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {user.role === 'ADMIN' && (
                        <button
                            onClick={() => router.push('/admin')}
                            style={{
                                padding: '0.5rem 1rem',
                                background: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            ⚙️ Admin
                        </button>
                    )}
                    <button
                        onClick={() => router.push('/profile')}
                        style={{
                            padding: '0.5rem 1rem',
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        👤 Profil
                    </button>
                    <button
                        onClick={logout}
                        style={{
                            padding: '0.5rem 1rem',
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Wyloguj
                    </button>
                </div>
            </header>

            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <h2>Panel edukacyjny</h2>

                <div style={{
                    marginBottom: '2rem',
                    padding: '1.5rem',
                    background: '#f8f9fa',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    {user.avatar_preset_id && user.avatar_preset_id !== 'default' && (
                        <img
                            src={`/avatars/${user.avatar_preset_id}.png`}
                            alt="Avatar"
                            style={{ width: '80px', height: '80px', borderRadius: '0.5rem' }}
                        />
                    )}
                    <div>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {user.username}
                        </p>
                        <p style={{ margin: '0.25rem 0 0 0', color: '#666' }}>
                            Rola: {user.role}
                        </p>
                        {user.avatar_preset_id === 'default' && (
                            <p style={{ margin: '0.25rem 0 0 0', color: '#f59e0b' }}>
                                ⚠️ Wybierz swój avatar w profilu
                            </p>
                        )}
                    </div>
                </div>

                {/* Materials Section */}
                <div style={{
                    marginTop: '2rem',
                    padding: '1.5rem',
                    background: 'white',
                    borderRadius: '1rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>📚 Materiały Edukacyjne</h3>
                    <p style={{ margin: '0 0 1rem 0', color: '#666' }}>
                        Przeglądaj materiały przygotowane przez nauczycieli
                    </p>
                    <button
                        onClick={() => router.push('/edu/materials')}
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
                    </button>
                </div>

                {/* Math Section */}
                <div style={{
                    marginTop: '1rem',
                    padding: '1.5rem',
                    background: 'white',
                    borderRadius: '1rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>🔢 Matematyka - Tabliczka Mnożenia</h3>
                    <p style={{ margin: '0 0 1rem 0', color: '#666' }}>
                        Ucz się tabliczki mnożenia poprzez grę i trening
                    </p>
                    <button
                        onClick={() => router.push('/edu/math')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '1rem'
                        }}
                    >
                        Przejdź do tabliczki →
                    </button>
                </div>

                {/* Quiz Section */}
                <div style={{
                    marginTop: '1rem',
                    padding: '1.5rem',
                    background: 'white',
                    borderRadius: '1rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>📝 Quiz Matematyczny</h3>
                    <p style={{ margin: '0 0 1rem 0', color: '#666' }}>
                        Sprawdź swoją wiedzę - 20 pytań, 80% = zaliczenie
                    </p>
                    <button
                        onClick={() => router.push('/edu/quiz/math')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '1rem'
                        }}
                    >
                        Rozpocznij quiz →
                    </button>
                </div>

                {/* English Quiz Section */}
                <div style={{
                    marginTop: '1rem',
                    padding: '1.5rem',
                    background: 'white',
                    borderRadius: '1rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>🇬🇧 Quiz Angielski</h3>
                    <p style={{ margin: '0 0 1rem 0', color: '#666' }}>
                        Przetłumacz słówka EN→PL i PL→EN - 80% = zaliczenie
                    </p>
                    <button
                        onClick={() => router.push('/edu/quiz/english')}
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
                        Rozpocznij quiz →
                    </button>
                </div>

                <div style={{
                    marginTop: '2rem',
                    padding: '1.5rem',
                    background: '#f0f0f0',
                    borderRadius: '0.5rem'
                }}>
                    <p>
                        ✅ Pomyślnie zalogowano!<br />
                        ✅ Hasło zostało zmienione!<br />
                        {user.avatar_preset_id !== 'default' && '✅ Avatar został ustawiony!'}
                        {user.avatar_preset_id === 'default' && '⚠️ Ustaw swój avatar w profilu!'}
                        <br />
                        ✅ Quizy matematyczne i angielskie dostępne!<br />
                        🚧 Gry będą dostępne wkrótce...
                    </p>
                </div>
            </div>
        </div>
    )
}
