"use client"

import { useState, useMemo, useRef } from "react"
import { useTaskContext } from "@/lib/task-context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Printer, FileSpreadsheet, Download, Calendar, User as UserIcon, Building2 } from "lucide-react"
import { formatDate, cn } from "@/lib/utils"
import { useReactToPrint } from "react-to-print"

export function OfficeAccomplishmentReport() {
  const { tasks, allEmployees } = useTaskContext()
  const [reportType, setReportType] = useState<"office" | "individual">("office")
  const componentRef = useRef(null)

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "",
  })

  // Get current week range (Sunday to Saturday)
  const weekRange = useMemo(() => {
    const now = new Date()
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)

    return { start, end }
  }, [])

  // Filter tasks for the report
  const weeklyTasks = useMemo(() => {
    const { start, end } = weekRange

    return tasks.filter(t => {
      const createdDate = new Date(t.createdAt)
      const isCreatedThisWeek = createdDate >= start && createdDate <= end

      let isCompletedThisWeek = false
      if (t.status === "completed" && t.completedAt) {
        const completedDate = new Date(t.completedAt)
        isCompletedThisWeek = completedDate >= start && completedDate <= end
      }

      // Include:
      // 1. Tasks completed this week
      // 2. Tasks created this week
      // 3. Ongoing tasks (In Progress or Todo) regardless of creation date
      return isCompletedThisWeek || isCreatedThisWeek || t.status === "in-progress" || t.status === "todo"
    })
  }, [tasks, weekRange])

  const employeeStats = useMemo(() => {
    return allEmployees.map(emp => {
      const empTasks = weeklyTasks.filter(t => t.assignees?.some(a => a.id === emp.id) || t.assigneeId === emp.id);
      const completed = empTasks.filter(t => t.status === "completed").length;
      const inProgress = empTasks.filter(t => t.status === "in-progress").length;
      const overdue = empTasks.filter(t => t.status !== "completed" && new Date(t.dueDate) < new Date()).length;

      const rate = empTasks.length > 0 ? Math.round((completed / empTasks.length) * 100) : 0;

      return {
        ...emp,
        total: empTasks.length,
        completed,
        inProgress,
        overdue,
        rate
      };
    }).sort((a, b) => b.rate - a.rate);
  }, [allEmployees, weeklyTasks])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20">
          <FileSpreadsheet className="h-4 w-4" />
          <span>Reports</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 pr-12">
          <DialogTitle>Weekly Accomplishment Reports</DialogTitle>
          <DialogDescription>
            Generate and print reports for the entire office or specific individuals.
          </DialogDescription>
        </DialogHeader>

        {/* REPORT SELECTOR BAR - Hidden in Print */}
        <div className="px-6 py-4 bg-slate-50 border-y border-slate-200 flex flex-wrap items-center gap-4 no-print">
          <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <button
              onClick={() => setReportType("office")}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                reportType === "office"
                  ? "bg-primary text-white shadow-md"
                  : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <Building2 className="h-3.5 w-3.5" />
              Office Report
            </button>
            <button
              onClick={() => setReportType("individual")}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                reportType === "individual"
                  ? "bg-primary text-white shadow-md"
                  : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <UserIcon className="h-3.5 w-3.5" />
              Individual Performance Report
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* PRINTABLE AREA */}
          <div className="mt-4 bg-white text-slate-900" ref={componentRef}>
            <table className="w-full border-collapse">
              <thead className="print-margin-header">
                <tr><td><div className="h-[1.5cm]" /></td></tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-8">
                    <div className="flex flex-col items-center mb-8 border-b border-slate-200 pb-6">
                      <div className="flex items-center justify-between w-full mb-4 px-10">
                        <img src="/logos/logo3.jpg" alt="Logo Left" className="h-20 w-20 object-contain" />
                        <div className="text-center flex-1 mx-4">
                          <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Republic of the Philippines</p>
                          <p className="text-lg font-black tracking-tight text-slate-900 uppercase">TaskFlow Organization</p>
                          <p className="text-xs font-semibold text-emerald-600">Office of the Provincial Management</p>
                        </div>
                        <img src="/logos/logo1.jpg" alt="Logo Right" className="h-20 w-20 object-contain" />
                      </div>
                      <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">
                          {reportType === "office" ? "Weekly Office Accomplishment Report" : "Individual Performance Commitment (IPCR) Summary"}
                        </h1>
                        <p className="text-sm font-medium text-slate-500 mt-1 flex items-center justify-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          {formatDate(weekRange.start.toISOString())} — {formatDate(weekRange.end.toISOString())}
                        </p>
                      </div>
                    </div>

                    {/* TABLE */}
                    <div className="w-full rounded-lg overflow-hidden print-table-container">
                      {reportType === "office" ? (
                        <>
                          <div className="grid grid-cols-[50px_1fr_1.5fr_1fr] text-[10px] uppercase tracking-wider font-bold bg-slate-100 border-b border-slate-300 text-slate-600 print-header">
                            <div className="p-3 border-l border-r border-slate-300 text-center">No.</div>
                            <div className="p-3 border-r border-slate-300">Programs & Activities</div>
                            <div className="p-3 border-r border-slate-300">Indicators / Target</div>
                            <div className="p-3 border-r border-slate-300 text-center">Status / Accomplishment</div>
                          </div>

                          {weeklyTasks.length > 0 ? (
                            weeklyTasks.map((task, index) => (
                              <div key={task.id} className="grid grid-cols-[50px_1fr_1.5fr_1fr] text-xs border-b border-slate-200 last:border-0 bg-white print-row">
                                <div className="p-4 border-l border-r border-slate-200 text-center font-medium text-slate-500">{index + 1}</div>
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
                                <div className="p-4 border-r border-slate-200 bg-slate-50/50">
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
                            <div className="p-12 text-center border-b border-slate-200">
                              <p className="text-slate-400 font-medium italic">No tasks found for this week range.</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-[40px_1fr_70px_100px_90px_80px_80px] text-[10px] uppercase tracking-wider font-bold bg-slate-100 border-b border-slate-300 text-slate-600 print-header">
                            <div className="p-3 border-l border-r border-slate-300 text-center">No.</div>
                            <div className="p-3 border-r border-slate-300">Employee Name & Position</div>
                            <div className="p-3 border-r border-slate-300 text-center">Targets</div>
                            <div className="p-3 border-r border-slate-300 text-center">Accomplished</div>
                            <div className="p-3 border-r border-slate-300 text-center">Ongoing</div>
                            <div className="p-3 border-r border-slate-300 text-center">Overdue</div>
                            <div className="p-3 border-r border-slate-300 text-center">Rating</div>
                          </div>

                          {employeeStats.map((emp, index) => (
                            <div key={emp.id} className="grid grid-cols-[40px_1fr_70px_100px_90px_80px_80px] text-xs border-b border-slate-200 last:border-0 bg-white print-row items-center">
                              <div className="p-4 border-l border-r border-slate-200 text-center font-medium text-slate-500">{index + 1}</div>
                              <div className="p-4 border-r border-slate-200">
                                <p className="font-bold text-slate-900">{emp.name}</p>
                                <p className="text-slate-500 text-[10px] uppercase tracking-tight">
                                  {emp.jobTitle || (emp.role === "head_admin" ? "Head Admin" : emp.role === "admin" ? "Admin" : "Employee")}
                                </p>
                              </div>
                              <div className="p-4 border-r border-slate-200 text-center font-bold text-slate-700">{emp.total}</div>
                              <div className="p-4 border-r border-slate-200 text-center text-emerald-600 font-bold">{emp.completed}</div>
                              <div className="p-4 border-r border-slate-200 text-center text-amber-600 font-bold">{emp.inProgress}</div>
                              <div className="p-4 border-r border-slate-200 text-center text-red-500 font-bold">{emp.overdue}</div>
                              <div className="p-4 border-r border-slate-200 text-center">
                                <div className={cn(
                                  "inline-block px-2 py-1 rounded text-[11px] font-black tracking-tighter",
                                  emp.rate >= 80 ? "bg-emerald-100 text-emerald-700" :
                                    emp.rate >= 50 ? "bg-amber-100 text-amber-700" :
                                      "bg-slate-100 text-slate-500"
                                )}>
                                  {emp.rate}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>

                    {/* SIGNATURES */}
                    <div className="grid grid-cols-2 gap-20 mt-16 px-4">
                      <div className="text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-10">Prepared by:</p>
                        <div className="border-b border-slate-900 w-full mb-1" />
                        <p className="text-xs font-bold text-slate-900 uppercase">
                          {reportType === "individual" ? "ADMINISTRATIVE OFFICER" : "Employee Name"}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500">
                          {reportType === "individual" ? "Records Management Section" : "Designation / Position"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-10">Approved by:</p>
                        <div className="border-b border-slate-900 w-full mb-1" />
                        <p className="text-xs font-bold text-slate-900 uppercase">AUTHORIZED OFFICIAL</p>
                        <p className="text-[11px] font-medium text-slate-500">Head Admin</p>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
              <tfoot className="print-margin-footer">
                <tr><td><div className="h-[1.5cm]" /></td></tr>
              </tfoot>
            </table>
          </div>

          {/* Printing CSS */}
          <style jsx global>{`
            @media print {
              @page {
                size: portrait;
                margin: 0;
              }
              body {
                background: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print {
                display: none !important;
              }
              .print-margin-header {
                display: table-header-group !important;
              }
              .print-margin-footer {
                display: table-footer-group !important;
              }
              .print-table-container {
                border: none !important;
                overflow: visible !important;
              }
              .print-header {
                border: 1px solid #cbd5e1 !important;
              }
              .print-row {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
                border: 1px solid #e2e8f0 !important;
                margin-top: -1px;
              }
              /* Internal vertical lines */
              .border-l, [class*="border-l"] {
                border-left: 1px solid #cbd5e1 !important;
              }
              .border-r, [class*="border-r"] {
                border-right: 1px solid #cbd5e1 !important;
              }
              .shadow-sm {
                box-shadow: none !important;
              }
            }
            @media screen {
              .print-margin-header, .print-margin-footer {
                display: none !important;
              }
            }
          `}</style>
        </div>

        <DialogFooter className="p-4 px-6 border-t bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex w-full items-center justify-between">
            <DialogClose asChild>
              <Button variant="ghost" className="text-slate-500 hover:text-slate-900">
                Close
              </Button>
            </DialogClose>
            <Button
              onClick={handlePrint}
              className="gap-2 bg-primary hover:bg-primary/90 shadow-md transition-all active:scale-95"
            >
              <Printer className="h-4 w-4" />
              Print Report
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
