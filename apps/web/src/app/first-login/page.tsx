'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function FirstLoginPage() {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const { user, updateUser } = useAuth()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (newPassword !== confirmPassword) {
            setError('Nowe hasła nie są identyczne')
            return
        }

        if (newPassword.length < 6) {
            setError('Nowe hasło musi mieć co najmniej 6 znaków')
            return
        }

        setIsLoading(true)

        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me/password`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.detail || 'Zmiana hasła nie powiodła się')
            }

            // Update user state
            if (user) {
                updateUser({ ...user, must_change_password: false })
            }

            // Redirect to dashboard
            router.push('/edu')
        } catch (err: any) {
            setError(err.message)
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
                maxWidth: '450px'
            }}>
                <h1 style={{ textAlign: 'center', marginBottom: '1rem', color: '#333' }}>
                    🔐 Pierwsze logowanie
                </h1>
                <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#666' }}>
                    Musisz zmienić hasło przed kontynuowaniem
                </p>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label htmlFor="current" style={{ display: 'block', marginBottom: '0.5rem', color: '#555' }}>
                            Obecne hasło
                        </label>
                        <input
                            id="current"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
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
                    <div style={{ marginBottom: '1rem' }}>
                        <label htmlFor="new" style={{ display: 'block', marginBottom: '0.5rem', color: '#555' }}>
                            Nowe hasło
                        </label>
                        <input
                            id="new"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
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
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="confirm" style={{ display: 'block', marginBottom: '0.5rem', color: '#555' }}>
                            Potwierdź nowe hasło
                        </label>
                        <input
                            id="confirm"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
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
                        {isLoading ? 'Zmiana...' : 'Zmień hasło'}
                    </button>
                </form>
            </div>
        </div>
    )
}
