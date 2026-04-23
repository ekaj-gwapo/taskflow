"use client"

import { useMemo, useRef } from "react"
import { useTaskContext } from "@/lib/task-context"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, FileSpreadsheet, Download, Calendar } from "lucide-react"
import { formatDate, cn } from "@/lib/utils"
import { useReactToPrint } from "react-to-print"

export function OfficeAccomplishmentReport() {
  const { tasks, allEmployees } = useTaskContext()
  const componentRef = useRef(null)

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Office-Accomplishment-Report-${new Date().toLocaleDateString()}`,
  })

  // Get current week range
  const weekRange = useMemo(() => {
    const now = new Date()
    const first = now.getDate() - now.getDay()
    const last = first + 6
    const start = new Date(now.setDate(first))
    const end = new Date(now.setDate(last))
    return { start, end }
  }, [])

  // Filter tasks for this week (created or completed this week)
  const weeklyTasks = useMemo(() => {
    const start = weekRange.start
    const end = weekRange.end
    
    return tasks.filter(t => {
      const createdDate = new Date(t.createdAt)
      const isCreatedThisWeek = createdDate >= start && createdDate <= end
      
      let isCompletedThisWeek = false
      if (t.status === "completed" && t.completedAt) {
        const completedDate = new Date(t.completedAt)
        isCompletedThisWeek = completedDate >= start && completedDate <= end
      }
      
      return isCreatedThisWeek || isCompletedThisWeek
    })
  }, [tasks, weekRange])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20">
          <FileSpreadsheet className="h-4 w-4" />
          <span>Accomplishment Report</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Weekly Office Accomplishment Report</DialogTitle>
              <DialogDescription>
                Summary of all organizational tasks and achievements for the current week.
              </DialogDescription>
            </div>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Print Report
            </Button>
          </div>
        </DialogHeader>

        {/* PRINTABLE AREA */}
        <div className="mt-6 p-8 border border-slate-200 rounded-xl bg-white text-slate-900 shadow-sm" ref={componentRef}>
          {/* Header Image/Logo Simulation */}
          <div className="flex flex-col items-center text-center mb-8 border-b border-slate-200 pb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-14 w-14 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-200">
                <span className="text-xl font-bold text-emerald-600">TF</span>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Republic of the Philippines</p>
                <p className="text-lg font-black tracking-tight text-slate-900 uppercase">TaskFlow Organization</p>
                <p className="text-xs font-semibold text-emerald-600">Office of the Provincial Management</p>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Weekly Office Accomplishment Report</h1>
              <p className="text-sm font-medium text-slate-500 mt-1 flex items-center justify-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(weekRange.start.toISOString())} — {formatDate(weekRange.end.toISOString())}
              </p>
            </div>
          </div>

          {/* TABLE */}
          <div className="w-full rounded-lg border border-slate-300 overflow-hidden">
            <div className="grid grid-cols-[50px_1fr_1.5fr_1fr] text-[10px] uppercase tracking-wider font-bold bg-slate-100 border-b border-slate-300 text-slate-600">
              <div className="p-3 border-r border-slate-300 text-center">No.</div>
              <div className="p-3 border-r border-slate-300">Programs & Activities</div>
              <div className="p-3 border-r border-slate-300">Indicators / Target</div>
              <div className="p-3">Status / Accomplishment</div>
            </div>

            {weeklyTasks.length > 0 ? (
              weeklyTasks.map((task, index) => (
                <div key={task.id} className="grid grid-cols-[50px_1fr_1.5fr_1fr] text-xs border-b border-slate-200 last:border-0 bg-white">
                  <div className="p-4 border-r border-slate-200 text-center font-medium text-slate-500">{index + 1}</div>
                  <div className="p-4 border-r border-slate-200">
                    <p className="font-bold text-slate-900 mb-1">{task.title}</p>
                    <p className="text-slate-500 text-[11px] leading-relaxed italic">{task.description || "No description provided."}</p>
                  </div>
                  <div className="p-4 border-r border-slate-200 space-y-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Assignees</span>
                      <span className="font-medium text-slate-800">
                        {task.assignees?.map(a => a.name).join(", ") || task.assigneeName || "Unassigned"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Target Date</span>
                        <span className="font-medium text-slate-800">{formatDate(task.dueDate)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Priority</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          task.priority === "high" ? "bg-red-100 text-red-700" :
                          task.priority === "medium" ? "bg-amber-100 text-amber-700" :
                          "bg-blue-100 text-blue-700"
                        )}>{task.priority}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50/50">
                    {task.status === "completed" ? (
                      <div>
                        <span className="inline-block px-2.5 py-1 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-2">Accomplished</span>
                        <p className="text-[11px] font-semibold text-slate-700">Finished on: {formatDate(task.completedAt)}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Task was marked as completed.</p>
                      </div>
                    ) : (
                      <div>
                        <span className="inline-block px-2.5 py-1 rounded bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider mb-2">In Progress</span>
                        <p className="text-[11px] font-semibold text-slate-700 mb-1.5">Status: {task.status === "in-progress" ? "Active" : "Queued"}</p>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-amber-500 h-full transition-all duration-500" 
                            style={{ width: `${task.status === "in-progress" ? 50 : 10}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-slate-500 bg-slate-50 text-sm font-medium">
                No tasks recorded for this week's accomplishment period.
              </div>
            )}
          </div>

          {/* Footer Signatures */}
          <div className="mt-16 grid grid-cols-2 gap-20">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-10">Prepared by:</p>
              <div className="border-b border-slate-300 w-full mb-2" />
              <p className="text-sm font-bold text-slate-900">Office Administrator</p>
              <p className="text-[11px] font-medium text-slate-500">TaskFlow Management System</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-10">Noted by:</p>
              <div className="border-b border-slate-300 w-full mb-2" />
              <p className="text-sm font-bold text-slate-900">Head of Office</p>
              <p className="text-[11px] font-medium text-slate-500">Provincial Treasurer</p>
            </div>
          </div>

          {/* Printing CSS */}
          <style jsx global>{`
            @media print {
              @page {
                size: landscape;
                margin: 0.5in;
              }
              body {
                background: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print {
                display: none !important;
              }
              .border {
                border-width: 1px !important;
              }
              .shadow-sm {
                box-shadow: none !important;
              }
            }
          `}</style>
        </div>
      </DialogContent>
    </Dialog>
  )
}
