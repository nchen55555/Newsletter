import { Container } from "@/app/components/container";
import { Navigation } from "@/app/components/header";

export default function AccessDeniedPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
            <Navigation />
            <Container>
                <div className="pt-12 pb-16 relative text-center">
                    <div className="max-w-2xl mx-auto">
                        <h1 className="text-3xl md:text-4xl font-semibold mb-6 text-neutral-900">
                            Access Required
                        </h1>
                        <p className="text-lg md:text-xl text-neutral-600 leading-relaxed">
                            Please create your profile to gain access to The Niche Network.
                        </p>
                    </div>
                </div>
            </Container>
        </div>
    );
}