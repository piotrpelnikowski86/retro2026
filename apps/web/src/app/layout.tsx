import React from 'react'

export const metadata = {
    title: 'Tymonteam.pl',
    description: 'Platforma edukacyjna',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pl">
            <body>{children}</body>
        </html>
    )
}
