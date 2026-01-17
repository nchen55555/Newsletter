'use client'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export function InterestInHiringForm({ ...props }: React.ComponentProps<typeof Card>) {
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    companyName: "",
    email: "",
    roles: "",
  })
    

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!form.companyName) {
        toast.error("Company name is required")
        return
      }
      if (!form.email) {
        toast.error("Email is required")
        return
      }
      if (!form.roles) {
        toast.error("Roles are required")
        return
      }

      const response = await fetch("/api/post_hire_interest", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })
      if (response.ok) {
        toast.success("Form submitted successfully. Excited to chat soon!")
      } else {
        toast.error("Submission failed, please try again.")
      }
    } catch (error) {
      toast.error(`An unexpected error occurred. ${String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Interest in Hiring Form</CardTitle>
        <CardDescription>
          Enter your information to secure your company a place on The Niche.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input id="company-name" type="text" placeholder="Acme Corp" required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                We&apos;ll use this to contact you about your hiring needs. We will not share your email
                with anyone else.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="roles">What can we help you with?</Label>
              <Input id="roles" type="text" required value={form.roles} onChange={(e) => setForm({ ...form, roles: e.target.value })} />
              <p className="text-xs text-muted-foreground">
                Please list how your company is expanding and how The Niche can help you.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Book a time for a call</Label>
              <Button
                asChild
                variant="outline"
                className="mt-1"
              >
                <a
                  href="https://calendly.com/nicole_chen/an-intro-to-the-niche"
                  target="_blank"
                  rel="noreferrer"
                >
                  Schedule on Calendly
                </a>
              </Button>
              <p className="text-xs text-muted-foreground">
                Use this link to pick a time that works best for you. We&apos;ll come prepared to discuss your hiring needs.
              </p>
            </div>
            <div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
