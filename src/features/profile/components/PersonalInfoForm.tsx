import { useState, useEffect, type FormEvent } from 'react'
import { Input } from '../../../design-system/components/Input'
import { Button } from '../../../design-system/components/Button'
import { useUser } from '../../../core/hooks/useUser'
import { upsertProfile } from '../../../core/user/userService'
import { useAuth } from '../../../core/hooks/useAuth'

export function PersonalInfoForm() {
  const { profile, refetchProfile } = useUser()
  const { user } = useAuth()

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [dob, setDob] = useState(profile?.date_of_birth ?? '')
  const [state, setState] = useState(profile?.state ?? '')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!profile) return
    setFullName(profile.full_name ?? '')
    setPhone(profile.phone ?? '')
    setDob(profile.date_of_birth ?? '')
    setState(profile.state ?? '')
  }, [profile])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    await upsertProfile({
      id: user.id,
      full_name: fullName,
      phone,
      date_of_birth: dob || null,
      state: state || null,
    })
    await refetchProfile()
    setSaved(true)
    setLoading(false)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form onSubmit={handleSave} className="flex max-w-lg flex-col gap-4">
      <Input
        label="Full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />
      <Input label="Street address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, City, ST 00000" />
      <div className="grid grid-cols-2 gap-4">
        <Input label="State / province" value={state} onChange={(e) => setState(e.target.value)} placeholder="CA" />
        <Input label="Phone number" type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <Input label="Date of birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
      <Input label="Email address" type="email" value={user?.email ?? ''} disabled hint="Email cannot be changed here" />
      <Button type="submit" loading={loading} className="w-fit">
        {saved ? 'Saved!' : 'Save changes'}
      </Button>
    </form>
  )
}

export default PersonalInfoForm
