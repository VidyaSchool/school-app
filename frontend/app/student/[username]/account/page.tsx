'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"
import { formatDate } from "@/lib/date-formatter"
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
import { Loader2Icon, UserIcon, UploadCloudIcon, BusIcon, FootprintsIcon, Link2Icon } from "lucide-react"

const STUDENT_DOCUMENT_SLOTS: DocumentSlot[] = [
  {
    type: "10th_certificate",
    title: "10th Certificate",
    description: "Class 10th passing certificate or official board marksheet (PDF or Image)",
    required: true,
  },
  {
    type: "student_aadhar",
    title: "Student Aadhar Card",
    description: "Student's Aadhaar identification card front & back scan (PDF or Image)",
    required: true,
  },
  {
    type: "parent_aadhar",
    title: "Parent Aadhar Card",
    description: "Father/Mother/Guardian Aadhaar identification card scan (PDF or Image)",
    required: true,
  },
  {
    type: "birth_certificate",
    title: "Birth Certificate",
    description: "Official municipal birth registration certificate (PDF or Image)",
    required: true,
  },
  {
    type: "parent_pan",
    title: "Parent PAN Card",
    description: "Father/Mother/Guardian Permanent Account Number (PAN) card (PDF or Image)",
    required: false,
  },
]

export default function StudentAccountPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
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

  const lastClassSectionUpdate = profile?.classSectionLastUpdated ? new Date(profile.classSectionLastUpdated) : null;
  const now = new Date();
  const isClassSectionLocked = lastClassSectionUpdate 
    ? (now.getTime() - lastClassSectionUpdate.getTime()) < 365 * 24 * 60 * 60 * 1000 
    : false;
  const nextAllowedDate = lastClassSectionUpdate 
    ? new Date(lastClassSectionUpdate.getTime() + 365 * 24 * 60 * 60 * 1000)
    : null;

  return (
    <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
          <p className="text-sm text-muted-foreground">Manage your profile details and upload identity documents.</p>
        </div>
        {activeTab === "profile" && (
          isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          ) : (
            <Button onClick={handleStartEdit}>Edit Profile</Button>
          )
        )}
      </div>

      {error && (
        <div className="p-3 text-sm rounded bg-destructive/15 text-destructive font-medium border border-destructive/25">
          {error}
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
                  <CardTitle>Student Details</CardTitle>
                  <CardDescription>Contact information</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Admission Number</Label>
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
                  <div>
                    <Label>Class</Label>
                    {isEditing ? (
                      <Select
                        value={profile.class || ''}
                        onValueChange={(val) => setProfile({...profile, class: val})}
                        disabled={isClassSectionLocked}
                      >
                        <SelectTrigger className="w-full h-8">
                          <SelectValue placeholder="Select Class" />
                        </SelectTrigger>
                        <SelectContent>
                          {["Nursery", "KG", ...Array.from({ length: 12 }, (_, i) => (i + 1).toString())].map((c) => (
                            <SelectItem key={c} value={c}>
                              {c === "Nursery" || c === "KG" ? c : `Class ${c}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm mt-1">
                        {profile.class ? (profile.class === "Nursery" || profile.class === "KG" ? profile.class : `Class ${profile.class}`) : "Not set"}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Section</Label>
                    {isEditing ? (
                      <Select
                        value={profile.section || ''}
                        onValueChange={(val) => setProfile({...profile, section: val})}
                        disabled={isClassSectionLocked}
                      >
                        <SelectTrigger className="w-full h-8">
                          <SelectValue placeholder="Select Section" />
                        </SelectTrigger>
                        <SelectContent>
                          {["A", "B", "C", "D", "E", "F"].map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm mt-1">{profile.section || "Not set"}</p>
                    )}
                  </div>
                  <div className="md:col-span-2 pt-2 border-t mt-2">
                    <Label className="text-sm font-semibold">Commute / Transport Mode</Label>
                    {isEditing ? (
                      <Select
                        value={profile.transportMode || 'walking'}
                        onValueChange={(val) => setProfile({...profile, transportMode: val})}
                      >
                        <SelectTrigger className="w-full h-9 mt-1">
                          <SelectValue placeholder="Select Commute Mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="walking">Walking / Self Commute</SelectItem>
                          <SelectItem value="transport">School Transport / Bus</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2 mt-1.5">
                        {profile.transportMode === 'transport' || profile.transportMode === 'school_bus' || profile.transportMode === 'bus' ? (
                          <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 py-1 px-3">
                            <BusIcon className="h-4 w-4" />
                            School Transport / Bus
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1.5 py-1 px-3 font-medium">
                            <FootprintsIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            Walking / Self Commute
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  {isEditing && isClassSectionLocked && nextAllowedDate && (
                    <div className="md:col-span-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                      Note: Class and section can only be changed once a year. They are currently locked. Next change allowed after {nextAllowedDate.toLocaleDateString()}.
                    </div>
                  )}
                  {isEditing && !isClassSectionLocked && (
                    <div className="md:col-span-2 text-xs font-medium text-muted-foreground">
                      Note: Class and section can only be changed once a year. After saving, you will not be able to change them for 365 days.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Parent/Guardian Details</CardTitle>
                  <CardDescription>Emergency contact information</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Parent Name</Label>
                    {isEditing ? (
                      <Input
                        value={profile.parentName || ''}
                        onChange={(e) => setProfile({...profile, parentName: e.target.value})}
                      />
                    ) : (
                      <p className="text-sm mt-1">{profile.parentName || "Not provided"}</p>
                    )}
                  </div>
                  <div>
                    <Label>Parent Phone</Label>
                    {isEditing ? (
                      <Input
                        value={profile.parentPhone || ''}
                        onChange={(e) => setProfile({...profile, parentPhone: e.target.value})}
                      />
                    ) : (
                      <p className="text-sm mt-1">{profile.parentPhone || "Not provided"}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label>Parent Email</Label>
                    {isEditing ? (
                      <Input
                        value={profile.parentEmail || ''}
                        onChange={(e) => setProfile({...profile, parentEmail: e.target.value})}
                      />
                    ) : (
                      <p className="text-sm mt-1">{profile.parentEmail || "Not provided"}</p>
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
        </TabsContent>

        <TabsContent value="upload">
          <DocumentUploadManager
            role="student"
            documentSlots={STUDENT_DOCUMENT_SLOTS}
            userId={user.id}
          />
        </TabsContent>

        <TabsContent value="connect">
          <ConnectedAccountsManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
