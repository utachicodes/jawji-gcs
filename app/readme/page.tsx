"use client"

import Image from "next/image"

export default function ReadmePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center p-6">
      <div className="max-w-3xl w-full text-center space-y-6">
        <div className="flex justify-center">
          <Image src="/jawji-logo.png" width={120} height={120} alt="JAWJI" priority />
        </div>
        <h1 className="text-3xl font-bold">JAWJI Ground Control Station (GCS)</h1>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <a href="https://nextjs.org/" target="_blank" rel="noreferrer">
            <img src="https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs" alt="Next.js" />
          </a>
          <a href="https://www.typescriptlang.org/" target="_blank" rel="noreferrer">
            <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
          </a>
          <a href="https://next-auth.js.org/" target="_blank" rel="noreferrer">
            <img src="https://img.shields.io/badge/Auth-NextAuth.js-2E3440" alt="Auth" />
          </a>
          <a href="https://ui.shadcn.com/" target="_blank" rel="noreferrer">
            <img src="https://img.shields.io/badge/UI-shadcn%2Fui-000000" alt="UI" />
          </a>
          <a href="https://github.com/pmndrs/zustand" target="_blank" rel="noreferrer">
            <img src="https://img.shields.io/badge/State-Zustand-764ABC" alt="State" />
          </a>
          <a href="./LICENSE" target="_blank" rel="noreferrer">
            <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" />
          </a>
        </div>
        <p className="text-muted-foreground">
          AI-powered, GPS-free autonomous drone control platform. Mission planning, fleet management,
          pre-flight checklists, and real-time operations — all in one web app.
        </p>
      </div>
    </div>
  )
}
