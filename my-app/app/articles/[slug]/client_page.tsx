"use client";
import { Navigation } from "@/app/components/header";
import { type SanityDocument } from "next-sanity";
import { ReferralInviteDialog } from '@/app/components/referral-invite-dialog';
import { SidebarLayout } from "@/app/components/sidebar-layout";
import { useSubscriptionContext } from '@/app/components/subscription_context';
import PostContent from './post_content';


export default function ClientPostPage({
  post,
}: {
  post: SanityDocument;
}) {
const { isSubscribed } = useSubscriptionContext();

  if (isSubscribed) {
    return (
      <SidebarLayout title="Articles">
        <div className={`max-w-4xl mx-auto px-8 pt-8 pb-8`}>
        <PostContent post={post} />
        </div>
      </SidebarLayout>
    )
  }
  return (
    <>
      <Navigation />
      <div className={`max-w-4xl mx-auto px-8 pt-8 pb-8`}>
        <PostContent post={post} />
        <ReferralInviteDialog companyName={post.title} />
      </div>
    </>
  )
}