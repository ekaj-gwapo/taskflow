"use client"

import { useState, useRef, useCallback } from "react"
import { useTaskContext } from "@/lib/task-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, X, Crop as CropIcon } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import Cropper, { Point, Area } from "react-easy-crop"

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
    if (!currentUser || !imageSrc || !croppedAreaPixels) return

    setLoading(true)
    try {
      const croppedImageBase64 = await getCroppedImg(imageSrc, croppedAreaPixels)
      const token = localStorage.getItem("token")
      
      const response = await fetch(`/api/users/${currentUser.id}/avatar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ avatarBase64: croppedImageBase64 })
      })

      if (response.ok) {
        const data = await response.json()
        login(data.user.role.toLowerCase() as any, data.user.id, data.user)
        onOpenChange(false)
        setImageSrc(null)
      }
    } catch (err) {
      console.error("Failed to save avatar", err)
    } finally {
      setLoading(false)
    }
  }

  const initials = currentUser?.name
    .split(" ")
    .map((n) => n[0])
    .join("")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile picture
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          {!imageSrc ? (
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                {currentUser?.avatar ? (
                  <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                ) : (
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload New Photo
              </Button>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-4">
              <div className="relative h-64 w-full bg-secondary rounded-md overflow-hidden">
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
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground w-8">Zoom</span>
                <Slider
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.1}
                  onValueChange={(v) => setZoom(v[0])}
                  className="flex-1"
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="ghost" onClick={() => setImageSrc(null)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  <CropIcon className="h-4 w-4 mr-2" />
                  {loading ? "Saving..." : "Crop & Save"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
