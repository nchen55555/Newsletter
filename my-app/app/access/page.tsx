'use server'
import LandingClient from "../components/landing_client";

export default async function Access() {  
  return (
   
    <div className="min-h-screen flex flex-col">
      {/* <Navigation /> */}
      <LandingClient />
    </div>
  );
}