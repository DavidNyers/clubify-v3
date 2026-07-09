import { redirect } from 'next/navigation'

export default function UserBookingsRedirectPage() {
  redirect('/profile?tab=tickets')
}
