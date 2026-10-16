'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/date-formatter"
import { Loader2Icon } from "lucide-react"
import { ProfileAvatarUpload } from "@/components/profile-avatar-upload"

export default function LibrarianAccountPage() {
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
    const res = await fetch('/api/account')
    const data = await res.json()
    setUser(data.user)
    setProfile(data.profile)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError("")
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile")
      }
      setIsSaving(false)
      setIsEditing(false)
      router.refresh()
      fetchData()
    } catch (err: any) {
      setError(err.message)
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
    <div className="page-container py-6 min-h-screen bg-background font-sans">
      <div className="page-content">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Account</h1>
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        ) : (
          <Button onClick={handleStartEdit}>Edit Profile</Button>
        )}
      </div>

      {error && (
        <div className="p-3 text-sm rounded bg-destructive/15 text-destructive font-medium border border-destructive/25">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Read-only account details</CardDescription>
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
              <Badge variant="outline" className="mt-1 capitalize">{user.role}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">User ID</label>
              <p className="text-sm mt-1 font-mono">{user.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Account Created</label>
              <p className="text-sm mt-1">{formatDate(user.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {profile && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Librarian Details</CardTitle>
              <CardDescription>Contact and profile details</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Librarian Employee ID</Label>
                <p className="text-sm mt-1 text-muted-foreground">{profile.admissionNumber || "N/A"}</p>
              </div>
              <div>
                <Label>Username</Label>
                {isEditing ? (
                  <Input
                    value={profile.username || ''}
                    onChange={(e) => setProfile({...profile, username: e.target.value})}
                  />
                ) : (
                  <p className="text-sm mt-1">@{profile.username || "Not set"}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <Label>Phone Number</Label>
                {isEditing ? (
                  <Input
                    value={profile.phoneNumber || ''}
                    onChange={(e) => setProfile({...profile, phoneNumber: e.target.value})}
                  />
                ) : (
                  <p className="text-sm mt-1">{profile.phoneNumber || "Not provided"}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
              <CardDescription>Residential address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Street Address</Label>
                {isEditing ? (
                  <Input
                    value={profile.address || ''}
                    onChange={(e) => setProfile({...profile, address: e.target.value})}
                  />
                ) : (
                  <p className="text-sm mt-1">{profile.address || "Not provided"}</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>City</Label>
                  {isEditing ? (
                    <Input
                      value={profile.city || ''}
                      onChange={(e) => setProfile({...profile, city: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm mt-1">{profile.city || "Not provided"}</p>
                  )}
                </div>
                <div>
                  <Label>State</Label>
                  {isEditing ? (
                    <Input
                      value={profile.state || ''}
                      onChange={(e) => setProfile({...profile, state: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm mt-1">{profile.state || "Not provided"}</p>
                  )}
                </div>
                <div>
                  <Label>Pincode</Label>
                  {isEditing ? (
                    <Input
                      value={profile.pincode || ''}
                      onChange={(e) => setProfile({...profile, pincode: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm mt-1">{profile.pincode || "Not provided"}</p>
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
