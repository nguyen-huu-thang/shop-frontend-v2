"use client"

import { createContext, useContext } from "react"

import type { ShopSettings } from "@/lib/types"

const ShopSettingsContext = createContext<ShopSettings | null>(null)

export function ShopSettingsProvider({
  settings,
  children,
}: {
  settings: ShopSettings
  children: React.ReactNode
}) {
  return (
    <ShopSettingsContext.Provider value={settings}>
      {children}
    </ShopSettingsContext.Provider>
  )
}

export function useShopSettings(): ShopSettings {
  const settings = useContext(ShopSettingsContext)
  if (!settings) throw new Error("ShopSettingsProvider is missing")
  return settings
}
