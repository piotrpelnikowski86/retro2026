'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
    const { user, logout } = useAuth()
    const router = useRouter()

    // Redirect if not admin
    React.useEffect(() => {
        if (user && user.role !== 'ADMIN') {
            router.push('/edu')
        }
    }, [user, router])

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
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>⚙️ Panel Administratora</h1>
                        <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
                            Witaj, {user.username}
                        </p>
                    </div>
                    <button
                        onClick={logout}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '1rem'
                        }}
                    >
                        Wyloguj
                    </button>
                </div>
            </header>

            {/* Content */}
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    {/* Groups Card */}
                    <div
                        onClick={() => router.push('/admin/groups')}
                        style={{
                            background: 'white',
                            borderRadius: '1rem',
                            padding: '2rem',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
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
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'
                            e.currentTarget.style.borderColor = 'transparent'
                        }}
                    >
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#333' }}>Klasy / Grupy</h2>
                        <p style={{ color: '#666', marginTop: '0.5rem' }}>
                            Zarządzaj klasami i grupami uczniów
                        </p>
                    </div>

                    {/* Students Card */}
                    <div
                        onClick={() => router.push('/admin/students')}
                        style={{
                            background: 'white',
                            borderRadius: '1rem',
                            padding: '2rem',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
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
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'
                            e.currentTarget.style.borderColor = 'transparent'
                        }}
                    >
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#333' }}>Uczniowie</h2>
                        <p style={{ color: '#666', marginTop: '0.5rem' }}>
                            Hurtowe tworzenie kont uczniów
                        </p>
                    </div>

                    {/* Materials Card */}
                    <div
                        onClick={() => router.push('/admin/materials')}
                        style={{
                            background: 'white',
                            borderRadius: '1rem',
                            padding: '2rem',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
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
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'
                            e.currentTarget.style.borderColor = 'transparent'
                        }}
                    >
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#333' }}>Materiały</h2>
                        <p style={{ color: '#666', marginTop: '0.5rem' }}>
                            Zarządzaj materiałami edukacyjnymi
                        </p>
                    </div>

                    {/* Vocabulary Card */}
                    <div
                        onClick={() => router.push('/admin/vocabulary')}
                        style={{
                            background: 'white',
                            borderRadius: '1rem',
                            padding: '2rem',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
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
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'
                            e.currentTarget.style.borderColor = 'transparent'
                        }}
                    >
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🇬🇧</div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#333' }}>Słówka Angielskie</h2>
                        <p style={{ color: '#666', marginTop: '0.5rem' }}>
                            Zarządzaj słówkami angielskimi
                        </p>
                    </div>
                </div>

                {/* Info Box */}
                <div style={{
                    background: 'white',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>ℹ️ Informacje</h3>
                    <p style={{ margin: 0, color: '#666', lineHeight: '1.6' }}>
                        Witaj w panelu administratora! Tutaj możesz zarządzać klasami, kontami uczniów i materiałami edukacyjnymi.
                        <br /><br />
                        ✅ Dostępne: Zarządzanie klasami/grupami, hurtowe tworzenie uczniów, materiały edukacyjne, słówka angielskie<br />
                        🚧 W przygotowaniu: Quizy matematyczne i angielskie
                    </p>
                </div>
            </div>
        </div>
    )
}
