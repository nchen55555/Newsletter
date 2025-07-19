"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
  } from "@/components/ui/dialog"
  import { Label } from "@/components/ui/label"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2Icon, Terminal } from "lucide-react"
import { useState } from "react"
  

export function Subscribe() {
    const [email, setEmail] = useState("")
    const [linkedinUrl, setLinkedinUrl] = useState("")
    const [dialogOpen, setDialogOpen] = useState(false)
    const [emailError, setEmailError] = useState(false)
    const [formError, setFormError] = useState(false)
    const [formSuccess, setFormSuccess] = useState(false)

    const validateLinkedInUrl = (url: string): boolean => {
        const linkedinRegex = /^https:\/\/(?:www\.)?linkedin\.com\/in\/[\w-]+\/?$/
        return linkedinRegex.test(url)
    }

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const isValid = emailRegex.test(email) && 
                        email.length <= 254 && 
                        email.split('@')[0].length <= 64
        return isValid
    }
    const handleSubscribe = (e: React.MouseEvent) => {
        e.preventDefault()
        if (email) {
            const isValid = validateEmail(email)
            setEmailError(!isValid)
            if (isValid) {
                setDialogOpen(true)
            }
        }
    }

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (email && linkedinUrl) {
            const isValid = validateLinkedInUrl(linkedinUrl) && validateEmail(email)
            setFormError(!isValid)
            console.log("is valid? ", isValid)
            if (isValid) {
                const res = await fetch('/api/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, linkedin_url: linkedinUrl }),
                })
                console.log("response: ", res)
                if (res.ok) {
                    setDialogOpen(false)
                    setFormSuccess(true)
                    setEmailError(false)
                    setFormError(false)
                    setEmail("")
                    setLinkedinUrl("")
                }
                else{
                    setFormError(true) 
                }
            }
        }
    }

    return (
        <div>
            <h3 className="text-lg font-medium mb-4 relative inline-block">
                <span className="relative z-10">subscribe</span>
                <span className="absolute inset-0 bg-yellow-200/50 -rotate-1 rounded-lg transform -skew-x-6" />
            </h3>
            <p className="text-neutral-600 mb-6">to get access</p>
            <div className="flex flex-col w-full max-w-sm gap-4">
                <div className="flex items-center gap-2">
                    <Input 
                        type="email" 
                        placeholder="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Button variant="outline" onClick={handleSubscribe}>subscribe</Button>
                </div>
                
                {emailError && (
                    <Alert variant="destructive">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Please use valid email address!</AlertTitle>
                    </Alert>
                )}

                {formSuccess && (
                    <Alert>
                        <CheckCircle2Icon />
                        <AlertTitle>   Success! You are subscribed!</AlertTitle>
                    </Alert>
                )}

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <span style={{ display: 'none' }} />
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] p-8">
                        <DialogHeader className="mb-8">
                            <DialogTitle className="text-2xl font-semibold">Complete Your Subscription</DialogTitle>
                            <DialogDescription className="text-lg mt-2">
                                Please verify your email and provide your LinkedIn profile to complete the subscription.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleFormSubmit}>
                            <div className="grid gap-8">
                                <div className="grid gap-4">
                                    <Label htmlFor="email" className="text-base font-medium">Email *</Label>
                                    <Input 
                                        id="email" 
                                        name="email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-12 text-lg px-4"
                                    />
                                </div>
                                <div className="grid gap-4">
                                    <Label htmlFor="linkedin" className="text-base font-medium">LinkedIn URL *</Label>
                                    <Input 
                                        id="linkedin" 
                                        name="linkedin" 
                                        value={linkedinUrl}
                                        onChange={(e) => setLinkedinUrl(e.target.value)}
                                        placeholder="https://www.linkedin.com/in/..." 
                                        className="h-12 text-lg px-4"
                                    />
                                </div>
                                {formError && (
                                    <Alert variant="destructive">
                                        <Terminal className="h-4 w-4" />
                                        <AlertTitle>Please use valid email address and LinkedIn URL!</AlertTitle>
                                    </Alert>
                                )}
                            </div>
                            <DialogFooter className="mt-8 gap-4">
                                <DialogClose asChild>
                                    <Button variant="outline" type="button" className="h-12 px-6">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" onClick={handleFormSubmit} className="h-12 px-8 text-lg">Subscribe</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}