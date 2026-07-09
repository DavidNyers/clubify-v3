import { redirect } from 'next/navigation'

export default function UserReviewsRedirectPage() {
  redirect('/profile?tab=reviews')
}
