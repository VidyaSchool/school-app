'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"
import { formatDate } from "@/lib/date-formatter"
import { Loader2Icon, AlertCircleIcon, UserIcon, UploadCloudIcon, Link2Icon } from "lucide-react"
import { ProfileAvatarUpload } from "@/components/profile-avatar-upload"
import { DocumentUploadManager, DocumentSlot } from "@/components/document-upload-manager"
import { ConnectedAccountsManager } from "@/components/connected-accounts-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"

const TEACHER_DOCUMENT_SLOTS: DocumentSlot[] = [
  {
    type: "teacher_degree",
    title: "Teacher Degree Certificate",
    description: "B.Ed, Graduation, Master's degree, or highest educational qualification certificate (PDF or Image)",
    required: true,
  },
  {
    type: "teacher_pan",
    title: "PAN Card",
    description: "Teacher's personal Permanent Account Number (PAN) Card (PDF or Image)",
    required: true,
  },
  {
    type: "teacher_aadhar",
    title: "Aadhar Card",
    description: "Teacher's personal Aadhaar identification card front & back scan (PDF or Image)",
    required: true,
  },
]

export default function TeacherAccountPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [initialProfile, setInitialProfile] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams?.get("tab") || "profile")

  useEffect(() => {
    const tab = searchParams?.get("tab")
    if (tab && (tab === "profile" || tab === "upload" || tab === "connect")) {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const res = await fetch('/api/account')
    const data = await res.json()
    setUser(data.user)
    setProfile(data.profile)
    setInitialProfile(JSON.parse(JSON.stringify(data.profile)))
  }

  // Parse change history
  const getChangeHistory = () => {
    if (!profile?.classSectionChanges) return []
    try {
      return JSON.parse(profile.classSectionChanges)
    } catch {
      return []
    }
  }

  const getActiveRollingChanges = () => {
    const history = getChangeHistory()
    const now = new Date()
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    return history
      .map((d: string) => new Date(d))
      .filter((d: Date) => d >= oneYearAgo)
      .sort((a: Date, b: Date) => a.getTime() - b.getTime())
  }

  const activeChanges = getActiveRollingChanges()
  const changesUsed = activeChanges.length
  const changesRemaining = Math.max(0, 2 - changesUsed)

  const handleStartSave = () => {
    const isClassChanged = profile.class !== initialProfile.class
    const isSectionChanged = profile.section !== initialProfile.section
    
    if (isClassChanged || isSectionChanged) {
      if (changesUsed >= 2) {
        const oldestChange = activeChanges[0]
        const nextAllowedDate = new Date(oldestChange.getTime() + 365 * 24 * 60 * 60 * 1000)
        setError(`You cannot change your class and section at this time. You've reached the limit of 2 changes per year. Next change allowed after ${nextAllowedDate.toLocaleDateString()}`)
        return
      }
      setShowConfirmDialog(true)
    } else {
      saveProfile()
    }
  }

  const saveProfile = async () => {
    setIsSaving(true)
    setError("")
    setShowConfirmDialog(false)
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

  return (
    <div className="flex flex-col gap-6 py-6 px-4 lg:px-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
          <p className="text-sm text-muted-foreground">Manage teacher profile, class assignments, and identity verification documents.</p>
        </div>
        {activeTab === "profile" && (
          isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleStartSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          ) : (
            <Button onClick={handleStartEdit}>Edit Profile</Button>
          )
        )}
      </div>

      {error && (
        <div className="p-3 text-sm rounded bg-destructive/15 text-destructive font-medium border border-destructive/25 flex items-start gap-2">
          <AlertCircleIcon className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            Profile Details
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <UploadCloudIcon className="h-4 w-4" />
            Upload Documents
          </TabsTrigger>
          <TabsTrigger value="connect" className="flex items-center gap-2">
            <Link2Icon className="h-4 w-4" />
            Connect
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
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
                  <CardTitle>Teacher Details</CardTitle>
                  <CardDescription>Contact & Class assignment details</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Teacher ID</Label>
                    <p className="text-sm mt-1 text-muted-foreground">{profile.admissionNumber || "N/A"}</p>
                  </div>
                  <div>
                    <Label>Username</Label>
                    {isEditing ? (
                      <Input
                        value={profile.username || ''}
                        onChange={(e) => setProfile({...profile, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")})}
                      />
                    ) : (
                      <p className="text-sm mt-1">@{profile.username || "Not set"}</p>
                    )}
                  </div>
                  <div>
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

                  {/* Class Teacher assignment fields */}
                  <div className="md:col-span-2 border-t pt-4 mt-2">
                    <h4 className="font-semibold text-sm mb-3">Class Teacher Assignment</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="assignedClass">Assigned Class</Label>
                        {isEditing ? (
                          <Select
                            value={profile.class || ''}
                            onValueChange={(val) => setProfile({...profile, class: val})}
                          >
                            <SelectTrigger id="assignedClass" className="w-full h-8">
                              <SelectValue placeholder="Select Class (Optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Not assigned</SelectItem>
                              {["Nursery", "KG", ...Array.from({ length: 12 }, (_, i) => (i + 1).toString())].map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c === "Nursery" || c === "KG" ? c : `Class ${c}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm mt-1">
                            {profile.class && profile.class !== "none" ? (profile.class === "Nursery" || profile.class === "KG" ? profile.class : `Class ${profile.class}`) : "Not assigned"}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="assignedSection">Assigned Section</Label>
                        {isEditing ? (
                          <Select
                            value={profile.section || ''}
                            onValueChange={(val) => setProfile({...profile, section: val})}
                            disabled={!profile.class || profile.class === 'none'}
                          >
                            <SelectTrigger id="assignedSection" className="w-full h-8">
                              <SelectValue placeholder="Select Section (Optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Not assigned</SelectItem>
                              {["A", "B", "C", "D", "E", "F"].map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm mt-1">
                            {profile.section && profile.section !== "none" ? profile.section : "Not assigned"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-3">
                      Note: Teachers can change their class teacher assignment up to 2 times a year. 
                      ({changesRemaining} out of 2 changes remaining this year).
                    </div>
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
        </TabsContent>

        <TabsContent value="upload">
          <DocumentUploadManager
            role="teacher"
            documentSlots={TEACHER_DOCUMENT_SLOTS}
            userId={user.id}
          />
        </TabsContent>

        <TabsContent value="connect">
          <ConnectedAccountsManager />
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog of Class Change Usage */}
      <AnimatePresence>
        {showConfirmDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card text-card-foreground max-w-md w-full rounded-lg shadow-xl border overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <AlertCircleIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Confirm Class/Section Assignment</h3>
                    <p className="text-xs text-muted-foreground">Class assignment changes are limited</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <p>
                    You are changing your class teacher assignment to:
                    <strong className="block text-primary mt-1">
                      {profile.class && profile.class !== "none" ? `Class ${profile.class} - ${profile.section && profile.section !== "none" ? profile.section : "No Section"}` : "Unassigned"}
                    </strong>
                  </p>

                  <div className="bg-muted p-3 rounded-md space-y-2 text-xs">
                    <div className="flex justify-between font-medium">
                      <span>Assigned Class Limit:</span>
                      <span>2 changes per year</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Changes Used (Last 365 Days):</span>
                      <span>{changesUsed} of 2</span>
                    </div>
                    <div className="flex justify-between font-bold text-amber-600 dark:text-amber-400">
                      <span>Changes Remaining:</span>
                      <span>{changesRemaining}</span>
                    </div>

                    {activeChanges.length > 0 && (
                      <div className="border-t pt-2 mt-2">
                        <span className="font-semibold block mb-1">Previous Changes:</span>
                        <ul className="list-disc pl-4 space-y-1">
                          {activeChanges.map((d: Date, idx: number) => (
                            <li key={idx}>
                              {d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground italic">
                    Note: Changing this will consume 1 change quota. Once you use all 2 changes, you will not be able to modify your class teacher assignment until 365 days have passed from your oldest change.
                  </p>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveProfile}>
                    Confirm & Save
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
