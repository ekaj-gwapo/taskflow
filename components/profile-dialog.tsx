"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useTaskContext } from "@/lib/task-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, Crop as CropIcon, Save, Sun, Moon, Palette, Check, User, Mail, Phone, MapPin, Camera, Loader2, Building2 } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import Cropper, { Point, Area } from "react-easy-crop"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { EmailSettingsCard } from "./email-settings-card"

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { currentUser, login } = useTaskContext()
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Text inputs
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [location, setLocation] = useState("")
  const [jobTitle, setJobTitle] = useState("")

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "")
      setPhone(currentUser.phone || "")
      setLocation(currentUser.location || "")
      setJobTitle(currentUser.jobTitle || "")
    }
  }, [currentUser, open])

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader()
      reader.addEventListener("load", () => {
        setImageSrc(reader.result?.toString() || null)
      })
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<string> => {
    const image = new Image()
    image.src = imageSrc
    await new Promise((resolve) => { image.onload = resolve })

    const canvas = document.createElement("canvas")
    canvas.width = 200
    canvas.height = 200
    const ctx = canvas.getContext("2d")

    if (!ctx) return ""

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      200,
      200
    )

    return canvas.toDataURL("image/jpeg")
  }

  const handleSave = async () => {
    if (!currentUser) return

    setLoading(true)
    try {
      const token = localStorage.getItem("token")

      // 1. Save Avatar if cropped
      if (imageSrc && croppedAreaPixels) {
        const croppedImageBase64 = await getCroppedImg(imageSrc, croppedAreaPixels)
        await fetch(`/api/users/${currentUser.id}/avatar`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ avatarBase64: croppedImageBase64 })
        })
      }

      // 2. Save Profile Details
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, phone, location, jobTitle })
      })

      if (response.ok) {
        const data = await response.json()
        login(data.user.role.toLowerCase() as any, data.user.id, data.user)
        toast.success("Profile updated successfully")
        onOpenChange(false)
        setImageSrc(null)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to update profile")
      }
    } catch (err) {
      console.error("Failed to save profile", err)
      toast.error("An error occurred while saving.")
    } finally {
      setLoading(false)
    }
  }

  const initials = currentUser?.name
    .split(" ")
    .map((n) => n[0])
    .join("")

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) {
        setImageSrc(null)
      }
      onOpenChange(val)
    }}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-0 border-none bg-transparent shadow-none [&>button]:hidden">
        <div className="relative w-full h-full p-[2px] bg-gradient-to-br from-primary/30 via-transparent to-primary/10 rounded-[2rem] shadow-2xl">
          <div className="relative bg-background/95 backdrop-blur-3xl border-none rounded-[2rem] overflow-hidden">
            <DialogHeader className="p-8 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-4xl font-black tracking-tight text-foreground">
                    My Profile
                  </DialogTitle>
                  <DialogDescription className="text-[11px] font-bold text-muted-foreground mt-2 uppercase tracking-widest">
                    Manage your identity and notification settings
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="p-8 pt-2">
              {!imageSrc ? (
                <div className="space-y-8">
                  {/* Avatar Section */}
                  <div className="flex flex-col items-center gap-6 py-4">
                    <div className="relative group">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="relative"
                      >
                        <div className="h-32 w-32 rounded-[2.5rem] overflow-hidden border-4 border-background shadow-2xl relative z-10">
                          <Avatar className="h-full w-full">
                            {currentUser?.avatar ? (
                              <AvatarImage src={currentUser.avatar} alt={currentUser.name} className="object-cover" />
                            ) : (
                              <AvatarFallback className="text-4xl font-black bg-gradient-to-br from-primary to-emerald-600 text-white">
                                {initials}
                              </AvatarFallback>
                            )}
                          </Avatar>
                        </div>

                        {/* Status Ring */}
                        <div className="absolute -inset-2 bg-gradient-to-tr from-primary/40 to-emerald-500/40 rounded-[3rem] blur-sm opacity-50 group-hover:opacity-100 transition-opacity" />

                        {/* Edit Overlay */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute -bottom-2 -right-2 h-12 w-12 rounded-2xl bg-primary text-white shadow-xl flex items-center justify-center z-20 border-4 border-background hover:bg-primary/90 transition-colors"
                        >
                          <Camera className="h-5 w-5" />
                        </motion.button>
                      </motion.div>

                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Account Role</p>
                      <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider border border-primary/20 shadow-sm">
                        {currentUser?.role === 'head_admin' ? 'HEAD ADMIN' : currentUser?.role?.replace('_', ' ').toUpperCase()}
                      </span>
                      {currentUser?.organizationName && (
                        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-foreground bg-secondary/40 px-5 py-2.5 rounded-2xl border border-border backdrop-blur-sm">
                          <Building2 className="h-4 w-4 text-primary" />
                          {currentUser.organizationName}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Identity Group */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Personal Info</span>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="name" className="text-[11px] font-bold text-muted-foreground ml-1">Display Name</Label>
                          <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-14 rounded-2xl bg-secondary/20 border-border focus:bg-background focus:border-primary transition-all font-medium"
                            placeholder="Your Name"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="jobTitle" className="text-[11px] font-bold text-muted-foreground ml-1">Job Title / Position</Label>
                          <Input
                            id="jobTitle"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            className="h-14 rounded-2xl bg-secondary/20 border-border focus:bg-background focus:border-primary transition-all font-medium"
                            placeholder="e.g. Senior Manager"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="phone" className="text-[11px] font-bold text-muted-foreground ml-1">Phone Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                            <Input
                              id="phone"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="h-14 pl-12 rounded-2xl bg-secondary/20 border-border focus:bg-background focus:border-primary transition-all font-medium"
                              placeholder="+1 234 567 890"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Workplace Group */}
                    <div className="space-y-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4 text-emerald-500" />
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Assignment</span>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="location" className="text-[11px] font-bold text-muted-foreground ml-1">Location</Label>
                            <div className="relative">
                              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                              <Input
                                id="location"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="h-14 pl-12 rounded-2xl bg-secondary/20 border-border focus:bg-background focus:border-primary transition-all font-medium"
                                placeholder="Location"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-6">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleSave}
                          disabled={loading}
                          className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 text-white font-black shadow-lg shadow-primary/30 flex items-center justify-center gap-3 hover:from-primary/90 hover:to-indigo-600/90 transition-all disabled:opacity-50 text-base"
                        >
                          {loading ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                          ) : (
                            <>
                              <Save className="h-5 w-5" />
                              Save Profile
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-8" />

                  <div className="w-full">
                    <EmailSettingsCard />
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-6">
                  <div className="relative h-80 w-full bg-secondary/50 rounded-[2rem] overflow-hidden border-2 border-dashed border-primary/20">
                    <Cropper
                      image={imageSrc}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                      cropShape="round"
                      showGrid={false}
                    />
                  </div>
                  <div className="space-y-4 px-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Camera className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Adjust Zoom</span>
                          <span className="text-xs font-black text-primary">{Math.round(zoom * 100)}%</span>
                        </div>
                        <Slider
                          value={[zoom]}
                          min={1}
                          max={3}
                          step={0.1}
                          onValueChange={(v) => setZoom(v[0])}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                    <Button
                      variant="ghost"
                      onClick={() => setImageSrc(null)}
                      className="rounded-2xl h-12 px-6 font-bold"
                    >
                      Discard
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={loading}
                      className="rounded-2xl h-12 px-8 font-bold shadow-xl"
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <CropIcon className="h-4 w-4 mr-2" />
                          Apply & Save
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
