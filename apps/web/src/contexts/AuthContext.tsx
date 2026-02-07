'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
    id: string
    username: string
    role: 'STUDENT' | 'ADMIN'
    group_id?: string
    student_no?: number
    must_change_password: boolean
    avatar_preset_id: string
}

interface AuthContextType {
    user: User | null
    token: string | null
    login: (username: string, password: string) => Promise<void>
    logout: () => void
    updateUser: (user: User) => void
    isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        // Check if user is logged in on mount
        const checkAuth = async () => {
            const storedToken = localStorage.getItem('token')
            if (storedToken) {
                setToken(storedToken)
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
                        headers: {
                            'Authorization': `Bearer ${storedToken}`
                        }
                    })
                    if (response.ok) {
                        const userData = await response.json()
                        setUser(userData)

                        // Redirect to password change if needed
                        if (userData.must_change_password) {
                            router.push('/first-login')
                        }
                    } else {
                        localStorage.removeItem('token')
                        setToken(null)
                    }
                } catch (error) {
                    console.error('Auth check failed:', error)
                    localStorage.removeItem('token')
                    setToken(null)
                }
            }
            setIsLoading(false)
        }

        checkAuth()
    }, [router])

    const login = async (username: string, password: string) => {
        const formData = new URLSearchParams()
        formData.append('username', username)
        formData.append('password', password)

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
        })

        if (!response.ok) {
            throw new Error('Login failed')
        }

        const data = await response.json()
        localStorage.setItem('token', data.access_token)
        setToken(data.access_token)

        // Fetch user data
        const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
            headers: {
                'Authorization': `Bearer ${data.access_token}`
            }
        })

        if (userResponse.ok) {
            const userData = await userResponse.json()
            setUser(userData)

            // Redirect based on must_change_password
            if (userData.must_change_password) {
                router.push('/first-login')
            } else {
                router.push('/edu')
            }
        }
    }

    const logout = () => {
        localStorage.removeItem('token')
        setUser(null)
        setToken(null)
        router.push('/login')
    }

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser)
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser, isLoading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
