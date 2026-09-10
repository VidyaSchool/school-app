"use client"

import * as React from "react"
import { GraduationCapIcon, BookOpenIcon, UserIcon } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface ClassInfo {
  class: string | null
  section: string | null
  subjects: { subject: string; teacherName: string }[]
  classTeacher: string | null
}

export function ClassInfoWidget() {
  const [info, setInfo] = React.useState<ClassInfo | null>(null)

  React.useEffect(() => {
    fetch("/api/student/class-info")
      .then(r => r.json())
      .then(setInfo)
      .catch(() => setInfo(null))
  }, [])

  return (
    <div className="mx-4 lg:mx-6">
      <Card className="@container/card">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="font-medium text-base text-foreground flex items-center gap-2">
            <GraduationCapIcon className="h-4 w-4 text-primary" />
            My Class
          </CardTitle>
          {info?.class ? (
            <Badge variant="secondary" className="px-3 py-1 font-semibold text-xs rounded-full">
              Class {info.class} – {info.section}
            </Badge>
          ) : null}
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="subjects" className="w-full">
            <TabsList className="w-full mb-4 grid grid-cols-2">
              <TabsTrigger value="subjects" className="gap-1.5 text-xs font-semibold">
                <BookOpenIcon className="h-3.5 w-3.5" />
                Subject Teachers
              </TabsTrigger>
              <TabsTrigger value="classteacher" className="gap-1.5 text-xs font-semibold">
                <UserIcon className="h-3.5 w-3.5" />
                Class Teacher
              </TabsTrigger>
            </TabsList>

            {/* Subject Teachers Tab */}
            <TabsContent value="subjects" className="mt-0 focus-visible:outline-hidden">
              {!info?.subjects?.length ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No subjects assigned yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {info.subjects.map((s, i) => (
                    <Card key={i} size="sm" className="bg-muted/30 border-muted-foreground/10 hover:bg-muted/50 transition-colors">
                      <CardContent className="p-3 flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-foreground leading-snug">
                          {s.subject}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                          {s.teacherName}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Class Teacher Tab */}
            <TabsContent value="classteacher" className="mt-0 focus-visible:outline-hidden">
              {info?.classTeacher ? (
                <Card size="sm" className="bg-muted/30 border-muted-foreground/10 hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar size="lg" className="border border-border">
                      <AvatarFallback className="font-bold text-primary bg-primary/10">
                        {info.classTeacher
                          .split(" ")
                          .slice(0, 2)
                          .map(n => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
                        Class Teacher
                      </span>
                      <span className="text-sm font-bold text-foreground truncate">
                        {info.classTeacher}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-muted-foreground/60" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">No class teacher assigned yet.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
