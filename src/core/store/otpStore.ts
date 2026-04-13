import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { STORAGE_KEYS } from '../../lib/constants'

interface OtpState {
  otpVerified: boolean
  setOtpVerified: (verified: boolean) => void
  clearOtp: () => void
}

export const useOtpStore = create<OtpState>()(
  persist(
    (set) => ({
      otpVerified: false,
      setOtpVerified: (verified) => set({ otpVerified: verified }),
      clearOtp: () => set({ otpVerified: false }),
    }),
    {
      name: STORAGE_KEYS.OTP_VERIFIED,
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
