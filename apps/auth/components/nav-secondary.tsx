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
        <SidebarMenu className="pl-1 group-data-[collapsible=icon]:pl-0 group-data-[collapsible=icon]:space-y-1">
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild 
                tooltip={item.title}
                className="text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/40 transition-all duration-150 h-9 rounded-xl pl-2 group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-9!"
              >
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
                  className="flex items-center gap-2 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center"
                >
                  {item.icon}
                  <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
