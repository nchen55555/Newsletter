import { InterestInHiringForm } from "@/app/components/hire_interest_form"
import { Container } from "../components/container"
import { Navigation } from "../components/header"
export default function Page() {
  return (
    <>
    <Navigation />
        <Container>
            <div className="flex min-h-svh w-full items-center justify-center">
            <div className="w-full max-w-sm">
                <InterestInHiringForm />
            </div>
            </div>
        </Container>
    </>
  )
}