'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const { login } = useAuth()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            await login(username, password)
        } catch (err) {
            setError('Nieprawidłowa nazwa użytkownika lub hasło')
            setIsLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontFamily: 'system-ui, sans-serif'
        }}>
            <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '1rem',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                width: '100%',
                maxWidth: '400px'
            }}>
                <h1 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#333' }}>
                    🎓 Tymonteam.pl
                </h1>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label htmlFor="username" style={{ display: 'block', marginBottom: '0.5rem', color: '#555' }}>
                            Nazwa użytkownika
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '0.5rem',
                                fontSize: '1rem'
                            }}
                            placeholder="np. 2C-15"
                        />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', color: '#555' }}>
                            Hasło
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '0.5rem',
                                fontSize: '1rem'
                            }}
                        />
                    </div>
                    {error && (
                        <div style={{
                            padding: '0.75rem',
                            marginBottom: '1rem',
                            background: '#fee',
                            color: '#c33',
                            borderRadius: '0.5rem',
                            fontSize: '0.9rem'
                        }}>
                            {error}
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: isLoading ? '#999' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            cursor: isLoading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isLoading ? 'Logowanie...' : 'Zaloguj się'}
                    </button>
                </form>
            </div>
        </div>
    )
}
