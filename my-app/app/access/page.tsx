import LandingClient from "../components/landing_client";

export const dynamic = 'force-dynamic';

export default function Access() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* <Navigation /> */}
      <LandingClient />
    </div>
  );
}