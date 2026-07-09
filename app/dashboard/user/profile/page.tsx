import { redirect } from 'next/navigation'

export default function UserProfileRedirectPage() {
  redirect('/profile?tab=settings')
}
