"use client"

import * as React from "react"
import { toast as sonnerToast, type ExternalToast } from "sonner"
import { Button } from "@/components/ui/button"

export interface ToastAddOptions extends Omit<ExternalToast, "action"> {
  title?: React.ReactNode
  description?: React.ReactNode
  type?: "default" | "success" | "info" | "warning" | "error"
  priority?: "high" | "low" | string
  actionProps?: {
    children?: React.ReactNode
    onClick?: (event?: React.MouseEvent<any>) => void
  }
}

function add(options: ToastAddOptions | string) {
  if (typeof options === "string") {
    return sonnerToast(options)
  }

  const { title, description, type, actionProps, priority, ...rest } = options

  const message = title ?? description ?? ""
  const toastDescription = title ? description : undefined

  const sonnerOptions: ExternalToast = {
    ...rest,
    ...(toastDescription !== undefined && { description: toastDescription }),
    ...(priority === "high" && { duration: rest.duration ?? 8000 }),
    ...(actionProps && {
      action: {
        label: actionProps.children ?? "Action",
        onClick: (event) => actionProps.onClick?.(event as any),
      },
    }),
  }

  switch (type) {
    case "success":
      return sonnerToast.success(message, sonnerOptions)
    case "error":
      return sonnerToast.error(message, sonnerOptions)
    case "info":
      return sonnerToast.info(message, sonnerOptions)
    case "warning":
      return sonnerToast.warning(message, sonnerOptions)
    default:
      return sonnerToast(message, sonnerOptions)
  }
}

function close(id?: string | number) {
  sonnerToast.dismiss(id)
}

const customToast = Object.assign(
  (message: string | React.ReactNode, data?: ExternalToast) => sonnerToast(message, data),
  sonnerToast,
  {
    add,
    close,
  }
)

export const toast = customToast
export { Toaster } from "@/components/ui/sonner"

export function ToastDemo() {
  function showToast() {
    const id = toast.add({
      title: "Event created",
      description: "Sunday, December 3 at 9:00 AM",
      actionProps: {
        children: "Undo",
        onClick() {
          toast.close(id)
        },
      },
    })
  }

  return (
    <Button variant="outline" onClick={showToast}>
      Show Toast
    </Button>
  )
}

export function ToastTypes() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() => toast.add({ description: "Event has been created." })}
      >
        Default
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.add({
            type: "success",
            description: "Event has been created.",
          })
        }
      >
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.add({
            type: "info",
            description: "Arrive 10 minutes before the event.",
          })
        }
      >
        Info
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.add({
            type: "warning",
            description: "The event cannot start before 8:00 AM.",
          })
        }
      >
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.add({
            type: "error",
            description: "The event could not be created.",
            priority: "high",
          })
        }
      >
        Error
      </Button>
    </div>
  )
}
