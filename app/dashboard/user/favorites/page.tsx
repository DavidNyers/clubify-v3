import { redirect } from 'next/navigation'

export default function UserFavoritesRedirectPage() {
  redirect('/profile?tab=favorites')
}
