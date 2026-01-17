"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  Users,
  FileText,
  User,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  useSidebar,
} from "@/components/ui/sidebar"
import { useSubscriptionContext } from "./subscription_context"
import { Login } from "./login"

export function AppSidebar() {
  const pathname = usePathname()
  const { isSubscribed } = useSubscriptionContext()
  const { state } = useSidebar()

  const [requestedConnectionsCount, setRequestedConnectionsCount] = React.useState(0)
  const [appliedToTheNiche, setAppliedToTheNiche] = React.useState(false)

  // Fetch profile data for connection count and applied status
  React.useEffect(() => {
    if (!isSubscribed) return

    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/get_profile", {
          credentials: "include",
          cache: "no-store",
        })
        if (!res.ok) return
        const profile = await res.json()

        const requestedConnections = profile.requested_connections_new || []
        setRequestedConnectionsCount(requestedConnections.length)
        setAppliedToTheNiche(profile.applied)
      } catch (e) {
        console.error("Failed to fetch profile:", e)
      }
    }

    fetchProfile()
  }, [isSubscribed])

  const navItems = [
    {
      title: "Articles",
      href: "/articles",
      icon: FileText,
      isActive: pathname === "/articles",
      show: isSubscribed,
      disabled: false,
    },
    {
      title: "Opportunity Feed",
      href: "/opportunities",
      icon: Building2,
      isActive: pathname === "/opportunities",
      show: isSubscribed,
      disabled: !appliedToTheNiche,
    },
    {
      title: "People",
      href: "/people",
      icon: Users,
      isActive: pathname === "/people",
      show: isSubscribed,
      badge: requestedConnectionsCount > 0 ? requestedConnectionsCount : undefined,
    },
    {
      title: "Profile",
      href: "/profile",
      icon: User,
      isActive: pathname === "/profile",
      show: isSubscribed,
      disabled: false,
    },
  ]

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/" className="group">
                <div className="grid flex-1 text-left text-lg leading-tight">
                  <span className="truncate font-semibold transition-all duration-300 group-hover:bg-gradient-to-r group-hover:from-yellow-400 group-hover:via-pink-400 group-hover:to-blue-400 group-hover:bg-clip-text group-hover:text-transparent">
                    the niche
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Search Section */}
        {/* {isSubscribed && state === "expanded" && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="px-3 py-2">
                <LandingPageSearch
                  isLandingPage={false}
                  isSubscribed={isSubscribed}
                  variant="compact"
                />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )} */}

        {/* Navigation Section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                if (!item.show) return null

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.isActive}
                      disabled={item.disabled}
                      tooltip={item.title}
                    >
                      <Link
                        href={item.href}
                        className={item.disabled ? "pointer-events-none opacity-50" : ""}
                      >
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                        {item.badge && (
                          <SidebarMenuBadge className="bg-gradient-to-r from-yellow-400 via-pink-400 to-blue-400 text-white">
                            {item.badge}
                          </SidebarMenuBadge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Privacy Policy for non-subscribed users */}
        {!isSubscribed && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/privacy">
                      <FileText className="size-4" />
                      <span>Privacy Policy</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="p-1 space-y-2">
          {state === "expanded" && <Login />}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
