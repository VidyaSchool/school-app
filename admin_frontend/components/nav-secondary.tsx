"use client"

import * as React from "react"

import Link from "next/link"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: React.ReactNode
    onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { isMobile, setOpenMobile } = useSidebar()
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu className="pl-1">
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild className="text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/40 transition-all duration-150 h-9 rounded-xl pl-2">
                <Link 
                  href={item.url} 
                  onClick={(e) => {
                    if (item.onClick) {
                      item.onClick(e)
                    }
                    if (isMobile) {
                      setOpenMobile(false)
                    }
                  }}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
