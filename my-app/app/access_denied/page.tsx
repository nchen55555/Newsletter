import { Container } from "@/app/components/container";
import { Navigation } from "@/app/components/header";

export default function AccessDeniedPage() {
    return (
        <div>
            <Navigation />
            <Container>
                <div className="pt-12 pb-16 relative text-center">
                    <h1 className="text-3xl md:text-4xl font-semibold mb-6 text-neutral-200">
                        Access Required
                    </h1>
                    <p className="text-lg md:text-xl text-neutral-200 leading-relaxed">
                        Please create your profile to gain access to The Niche Network.
                    </p>
                </div>
            </Container>
        </div>
    );
}