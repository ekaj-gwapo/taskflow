"use client"

import { useTaskContext } from "@/lib/task-context"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, AlertCircle, CheckCircle2, Clock } from "lucide-react"

// Animated Sun Component
function AnimatedSun({ className, size = 24, isBackground = false }: { className?: string, size?: number, isBackground?: boolean }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <radialGradient id="sunGradientMain" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" stopColor="#fff7ed" />
          <stop offset="20%" stopColor="#fef3c7" />
          <stop offset="60%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#ea580c" />
        </radialGradient>
        <filter id="sunHalo" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={isBackground ? "4" : "1"} result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Outer Halo/Glow */}
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        fill="#fbbf24"
        initial={{ opacity: 0.1, scale: 0.8 }}
        animate={{ 
          opacity: [0.1, 0.3, 0.1],
          scale: [0.8, 1.2, 0.8]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Sun Rays */}
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        style={{ originX: "12px", originY: "12px" }}
      >
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <motion.rect
            key={angle}
            x="11.5"
            y="1"
            width="1"
            height="5"
            rx="0.5"
            fill="#f59e0b"
            transform={`rotate(${angle} 12 12)`}
            animate={{ 
              opacity: [0.3, 0.8, 0.3],
              height: [4, 7, 4],
              y: [1, -1, 1]
            }}
            transition={{ 
              duration: 2.5, 
              repeat: Infinity, 
              delay: i * 0.3,
              ease: "easeInOut" 
            }}
          />
        ))}
      </motion.g>

      {/* Sun Body */}
      <motion.circle
        cx="12"
        cy="12"
        r="6"
        fill="url(#sunGradientMain)"
        filter="url(#sunHalo)"
        animate={{ 
          scale: [1, 1.1, 1],
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />
    </motion.svg>
  )
}

// Animated CloudSun Component
function AnimatedCloudSun({ className, size = 24, isBackground = false }: { className?: string, size?: number, isBackground?: boolean }) {
  return (
    <motion.div className={`relative ${className}`} style={{ width: size, height: size }}>
      <AnimatedSun size={size * 0.75} className="absolute -top-[5%] -right-[5%]" isBackground={isBackground} />
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0"
      >
        <defs>
          <linearGradient id="cloudGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f1f5f9" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="cloudGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        
        {/* Back Cloud (2nd cloud) */}
        <motion.path
          d="M17.5 19c2.5 0 4.5-2 4.5-4.5 0-2.4-1.9-4.3-4.2-4.5C17.3 7.3 14.8 5 12 5c-2.4 0-4.5 1.7-5 4-2.2.3-4 2.2-4 4.5C3 16.5 5 18.5 7.5 18.5"
          fill="url(#cloudGrad2)"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-slate-400/30 dark:text-slate-600/30"
          animate={{ 
            x: [0, 2, 0],
            y: [-4, -6, -4],
            scale: [0.55, 0.6, 0.55] // Made smaller
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          style={{ originX: "12px", originY: "12px" }}
        />

        {/* Front Cloud (lower) */}
        <motion.path
          d="M17.5 19c2.5 0 4.5-2 4.5-4.5 0-2.4-1.9-4.3-4.2-4.5C17.3 7.3 14.8 5 12 5c-2.4 0-4.5 1.7-5 4-2.2.3-4 2.2-4 4.5C3 16.5 5 18.5 7.5 18.5"
          fill="url(#cloudGrad1)"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-slate-300/50 dark:text-slate-700/50"
          animate={{ 
            x: [-2, 1, -2],
            y: [4, 2, 4],
            scale: [0.65, 0.7, 0.65] // Made smaller
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          style={{ originX: "12px", originY: "12px" }}
        />
      </motion.svg>
    </motion.div>
  )
}

// Animated Moon Component
function AnimatedMoon({ className, size = 24 }: { className?: string, size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <radialGradient id="moonGradient" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#475569" />
        </radialGradient>
      </defs>
      <motion.path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        fill="url(#moonGradient)"
        stroke="#94a3b8"
        strokeWidth="0.5"
        animate={{ 
          rotate: [-3, 3, -3],
          scale: [1, 1.03, 1]
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />
      {/* Stars */}
      {[
        { x: 16, y: 8, d: 0 },
        { x: 10, y: 15, d: 1 },
        { x: 14, y: 18, d: 0.5 },
        { x: 19, y: 14, d: 1.5 }
      ].map((star, i) => (
        <motion.circle
          key={i}
          cx={star.x}
          cy={star.y}
          r={i % 2 === 0 ? 0.7 : 0.4}
          fill="white"
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, delay: star.d }}
        />
      ))}
    </motion.svg>
  )
}

export function SmartBriefing() {
  const { currentUser, tasks, allEmployees } = useTaskContext()
  
  if (!currentUser) return null

  const role = currentUser.role?.toLowerCase()
  const isHeadAdmin = role === "head_admin"
  const isSuperAdmin = role === "superadmin"
  const isAdmin = role === "admin"
  const isManagement = isHeadAdmin || isSuperAdmin || isAdmin

  const hour = new Date().getHours()
  let greeting = "Good morning"
  let AnimatedIcon = AnimatedSun
  
  if (hour >= 12 && hour < 17) {
    greeting = "Good afternoon"
    AnimatedIcon = AnimatedCloudSun
  } else if (hour >= 17) {
    greeting = "Good evening"
    AnimatedIcon = AnimatedMoon
  }

  const today = new Date().toISOString().split('T')[0]
  
  // General Stats
  const tasksDueToday = tasks.filter(t => {
    if (t.status === "completed" || t.archived) return false
    return t.dueDate && t.dueDate.startsWith(today)
  }).length

  const overdueTasks = tasks.filter(t => {
    if (t.status === "completed" || t.archived) return false
    return t.dueDate && new Date(t.dueDate) < new Date()
  }).length

  const completedToday = tasks.filter(t => {
    if (t.status !== "completed") return false
    return t.completedAt && t.completedAt.startsWith(today)
  }).length

  const inProgressTasks = tasks.filter(t => {
    if (t.status !== "in-progress" || t.archived) return false
    return true
  }).length

  // Management Specific Stats
  const totalTasks = tasks.length
  const pendingExtensions = tasks.filter(t => {
    const isCreator = t.createdById === currentUser.id
    const isSuperAdmin = currentUser.role?.toUpperCase() === "SUPERADMIN"
    
    // Only count if user is Creator/SuperAdmin AND there is a pending request NOT from themselves
    const hasReviewableRequest = t.extensionRequests?.some(r => 
      r.status === "PENDING" && r.requestedById !== currentUser.id
    )
    
    return (isCreator || isSuperAdmin) && hasReviewableRequest
  }).length
  const totalEmployees = allEmployees.length
  const completedLifetime = tasks.filter(t => t.status === "completed").length


  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mb-8 p-6 rounded-[2.5rem] glass-card relative overflow-hidden group border-white/20 dark:border-white/5"
    >
      {/* Decorative background icon - Moved to left to avoid overlap with right-aligned stats */}
      <div className="absolute -top-16 -left-16 p-8 opacity-[0.12] group-hover:opacity-[0.25] transition-all duration-1000 scale-110 group-hover:scale-125">
        <AnimatedIcon size={280} isBackground={true} />
      </div>
      
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 lg:gap-16">
        <div className="max-w-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-white/50 dark:bg-black/20 flex items-center justify-center shadow-lg backdrop-blur-md border border-white/50 dark:border-white/10">
              <AnimatedIcon size={32} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] leading-none mb-1">{greeting}</span>
              <div className="h-1 w-8 bg-primary/30 rounded-full" />
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight leading-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-500">{currentUser.name.split(" ")[0]}</span>!
          </h1>
          <p className="text-muted-foreground mt-4 text-sm md:text-lg font-medium leading-relaxed max-w-lg">
            {isManagement ? (
              <>
                You are currently overseeing <span className="text-foreground font-bold">{totalTasks} tasks</span>. 
                {pendingExtensions > 0 && (
                  <span className="block mt-2 text-primary font-bold">
                    🔔 {pendingExtensions} pending extensions await review.
                  </span>
                )}
                {overdueTasks > 0 && (
                  <span className="block mt-1">
                    <span className="text-destructive font-bold">{overdueTasks} critical items</span> require attention.
                  </span>
                )}
              </>
            ) : (
              <>
                You have <span className="text-foreground font-bold">{tasksDueToday} tasks</span> due today. 
                {overdueTasks > 0 && <span className="block mt-1"> Heads up! <span className="text-destructive font-bold">{overdueTasks} tasks</span> are overdue.</span>}
              </>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 lg:ml-auto">
          <div className="contents">
            <StatBox 
              icon={<Calendar className="h-5 w-5" />} 
              label={isManagement ? "Total Tasks" : "Due Today"} 
              value={isManagement ? totalTasks : tasksDueToday} 
              color="text-primary"
              bg="bg-primary/10"
              borderColor="border-primary/20"
            />
            <StatBox 
              icon={<AlertCircle className="h-5 w-5" />} 
              label={isManagement ? "Overdue Tasks" : "Overdue"} 
              value={overdueTasks} 
              color="text-destructive"
              bg="bg-destructive/10"
              borderColor="border-destructive/20"
            />
          </div>
          <div className="contents">
            <StatBox 
              icon={<Clock className="h-5 w-5" />} 
              label={isManagement ? "In Progress" : "In Progress"} 
              value={isManagement ? (totalTasks - completedLifetime) : inProgressTasks} 
              color="text-amber-600"
              bg="bg-amber-500/10"
              borderColor="border-amber-500/20"
            />
            <StatBox 
              icon={<CheckCircle2 className="h-5 w-5" />} 
              label={isManagement ? "Completed" : "Completed Today"} 
              value={isManagement ? completedLifetime : completedToday} 
              color="text-emerald-600"
              bg="bg-emerald-500/10"
              borderColor="border-emerald-500/20"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function StatBox({ icon, label, value, color, bg, borderColor }: { icon: React.ReactNode, label: string, value: number, color: string, bg: string, borderColor: string }) {
  return (
    <motion.div 
      whileHover={{ y: -6, scale: 1.05, backgroundColor: "rgba(255,255,255,0.8)" }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`px-6 py-5 rounded-[2rem] ${bg} border ${borderColor} flex items-center gap-5 min-w-[160px] shadow-sm backdrop-blur-md relative overflow-hidden group/stat`}
    >
      <div className={`h-12 w-12 rounded-2xl bg-white/60 dark:bg-black/40 flex items-center justify-center ${color} shadow-inner transition-transform group-hover/stat:scale-110`}>
        {icon}
      </div>
      <div>
        <p className={`text-3xl font-black leading-none ${color}`}>{value}</p>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">{label}</p>
      </div>
    </motion.div>
  )
}
