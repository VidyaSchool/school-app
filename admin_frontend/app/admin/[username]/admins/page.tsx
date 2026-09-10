"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, UserPlus, Shield, Loader2 } from "lucide-react"

interface Admin {
  id: string
  name: string
  email: string
  username: string
  designation: string
  createdAt: string
}

const DESIGNATIONS = [
  { value: "developer", label: "Developer", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  { value: "principal", label: "Principal", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "vice-principal", label: "Vice Principal", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200" },
  { value: "admin", label: "Admin", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "accountant", label: "Accountant", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
]

export default function AdminsPage() {
  const router = useRouter()
  const params = useParams()
  const username = params.username as string
  
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admin/list")
      const data = await res.json()
      setAdmins(data)
    } catch (error) {
      console.error("Failed to fetch admins:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDesignationBadge = (designation: string) => {
    const designationInfo = DESIGNATIONS.find(d => d.value === designation)
    return designationInfo || DESIGNATIONS[3]
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 py-6 px-6 lg:px-8 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full"
            onClick={() => router.push(`/admin/${username}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Admin Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage administrative roles and permissions
            </p>
          </div>
        </div>
        
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Admin
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Administrators</CardTitle>
          <CardDescription>
            All users with administrative access to the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {admins.length > 0 ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => {
                    const designation = getDesignationBadge(admin.designation)
                    return (
                      <TableRow key={admin.id}>
                        <TableCell className="font-medium">{admin.name}</TableCell>
                        <TableCell className="text-muted-foreground">{admin.email}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            @{admin.username}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={designation.color}>
                            {designation.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground border border-dashed rounded-lg">
              No administrators found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
