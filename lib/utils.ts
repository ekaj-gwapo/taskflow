import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString // Return original if invalid
  
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatDateTime(dateString: string | null | undefined) {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString

  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function calculateTaskProgress(task: any) {
  if (!task.actionSteps || task.actionSteps.length === 0) {
    return task.status === "completed" ? 100 : 0;
  }
  const totalSteps = task.actionSteps.length;
  const completedSteps = task.actionSteps.filter((s: any) => s.completed).length;
  return Math.round((completedSteps / totalSteps) * 100);
}
