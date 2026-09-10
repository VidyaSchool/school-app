'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/date-formatter"
import { Loader2Icon, AlertCircleIcon } from "lucide-react"
import { ProfileAvatarUpload } from "@/components/profile-avatar-upload"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AdminAccountPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/account')
      const data = await res.json()
      setUser(data.user)
      setProfile(data.profile)
    } catch (err: any) {
      setError("Failed to load profile details")
    }
  }

  const saveProfile = async () => {
    setIsSaving(true)
    setError("")
    
    // Validate username format
    const cleanUsername = profile.username?.trim().toLowerCase()
    if (!cleanUsername) {
      setError("Username is required")
      setIsSaving(false)
      return
    }
    
    if (!/^[a-zA-Z0-9_-]{3,15}$/.test(cleanUsername)) {
      setError("Username must be 3-15 characters long and contain only letters, numbers, hyphens, or underscores.")
      setIsSaving(false)
      return
    }

    try {
      const res = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          username: cleanUsername
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile")
      }
      setIsSaving(false)
      setIsEditing(false)
      
      if (data.newUsername && window.location.pathname !== `/admin/${data.newUsername}/account`) {
        router.push(`/admin/${data.newUsername}/account`)
      } else {
        router.refresh()
        fetchData()
      }
    } catch (err: any) {
      setError(err.message || "Failed to save profile")
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setError("")
    fetchData()
  }

  const handleStartEdit = () => {
    setError("")
    setIsEditing(true)
  }

  if (!user) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  return (
    <div className="flex flex-col gap-6 py-6 px-6 lg:px-8 bg-background min-h-screen font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Profile Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your administrative user account</p>
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
            <Button size="sm" onClick={saveProfile} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={handleStartEdit}>Edit Profile</Button>
        )}
      </div>

      {error && (
        <div className="p-3 text-sm rounded bg-destructive/15 text-destructive font-medium border border-destructive/25 flex items-start gap-2 max-w-2xl">
          <AlertCircleIcon className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Main login identity attributes (Read-only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <ProfileAvatarUpload
                currentImage={user.image}
                userName={user.name}
                onAvatarUpdated={(newUrl) => setUser({ ...user, image: newUrl })}
              />
              <div>
                <h3 className="text-xl font-semibold">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <Badge variant="outline" className="mt-1.5 capitalize font-medium">{user.role}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User ID</label>
                <p className="text-sm mt-1 font-mono">{user.id}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Created</label>
                <p className="text-sm mt-1">{formatDate(user.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {profile && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Administrative Details</CardTitle>
                <CardDescription>Designation & system identity settings</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  {isEditing ? (
                    <Input
                      id="username"
                      value={profile.username || ''}
                      onChange={(e) => setProfile({...profile, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "")})}
                      placeholder="e.g. rajan_admin"
                    />
                  ) : (
                    <p className="text-sm font-medium">@{profile.username || "Not set"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryRole">Secondary Designation</Label>
                  {isEditing ? (
                    <Select
                      value={profile.secondaryRole || ''}
                      onValueChange={(val) => setProfile({...profile, secondaryRole: val})}
                    >
                      <SelectTrigger id="secondaryRole" className="w-full">
                        <SelectValue placeholder="Select Designation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="developer">Developer</SelectItem>
                        <SelectItem value="principal">Principal</SelectItem>
                        <SelectItem value="vice-principal">Vice-Principal</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm capitalize font-medium">
                      {profile.secondaryRole ? profile.secondaryRole.replace("-", " ") : "Not set"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  {isEditing ? (
                    <Input
                      id="phoneNumber"
                      value={profile.phoneNumber || ''}
                      onChange={(e) => setProfile({...profile, phoneNumber: e.target.value})}
                      placeholder="e.g. +91 9999999999"
                    />
                  ) : (
                    <p className="text-sm font-medium">{profile.phoneNumber || "Not provided"}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Address Information</CardTitle>
                <CardDescription>Your contact address details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  {isEditing ? (
                    <Input
                      id="address"
                      value={profile.address || ''}
                      onChange={(e) => setProfile({...profile, address: e.target.value})}
                      placeholder="e.g. 123 Main St"
                    />
                  ) : (
                    <p className="text-sm font-medium">{profile.address || "Not provided"}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    {isEditing ? (
                      <Input
                        id="city"
                        value={profile.city || ''}
                        onChange={(e) => setProfile({...profile, city: e.target.value})}
                        placeholder="e.g. Delhi"
                      />
                    ) : (
                      <p className="text-sm font-medium">{profile.city || "Not provided"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    {isEditing ? (
                      <Input
                        id="state"
                        value={profile.state || ''}
                        onChange={(e) => setProfile({...profile, state: e.target.value})}
                        placeholder="e.g. Delhi"
                      />
                    ) : (
                      <p className="text-sm font-medium">{profile.state || "Not provided"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    {isEditing ? (
                      <Input
                        id="pincode"
                        value={profile.pincode || ''}
                        onChange={(e) => setProfile({...profile, pincode: e.target.value})}
                        placeholder="e.g. 110001"
                      />
                    ) : (
                      <p className="text-sm font-medium">{profile.pincode || "Not provided"}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
