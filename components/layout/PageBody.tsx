"use client"

import { ReactNode } from "react"

interface PageBodyProps {
    children: ReactNode
    className?: string
}

export function PageBody({ children, className }: PageBodyProps) {
    return (
        <div className={className || "flex flex-col gap-6 p-8"}>
            {children}
        </div>
    )
}
