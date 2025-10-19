"use client"
import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Settings } from "@/components/settings"
import { AuthWrapper } from "@/components/auth-wrapper"
import { AppLayout } from "@/components/app-layout"

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = (searchParams.get("tab") || "fleet").toLowerCase()
  const [tab, setTab] = useState<string>(tabParam)

  useEffect(() => {
    const next = (searchParams.get("tab") || "fleet").toLowerCase()
    setTab(next)
  }, [searchParams])

  const setTabInUrl = (next: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set("tab", next)
    router.replace(url.pathname + "?" + url.searchParams.toString())
    setTab(next)
  }

  return (
    <AuthWrapper>
      <AppLayout>
        {/* Settings component renders Tabs internally. We pass selected tab via a data attribute for now (non-invasive). */}
        <div data-selected-tab={tab}>
          <Settings />
        </div>
        {/* Minimal script to sync tabs when clicked, without refactoring Settings component now. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                const root=document.currentScript.parentElement; if(!root) return;
                const observer=new MutationObserver(()=>{
                  const list=root.querySelector('[role="tablist"]');
                  if(!list) return;
                  const tabs=[...list.querySelectorAll('[role="tab"]')];
                  tabs.forEach(t=>{
                    t.addEventListener('click',()=>{
                      const value=t.getAttribute('data-state')==='active' ? t.getAttribute('data-value') : t.getAttribute('data-value');
                      if(value){
                        const url=new URL(location.href); url.searchParams.set('tab', value.toLowerCase()); history.replaceState(null,'',url);
                      }
                    }, { once: true });
                  })
                });
                observer.observe(root, { childList:true, subtree:true });
              })();
            `,
          }}
        />
      </AppLayout>
    </AuthWrapper>
  )
}
