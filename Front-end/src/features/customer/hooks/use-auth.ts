import { useState } from 'react';
import { authService } from '../../../services/customer/auth.service';
import { useAuth } from '../../../context/AuthContext';
import { signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../../config/firebase-config';

export function useCustomerRegister() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<{ message?: string } | null>(null);

  const mutateAsync = async (data: { fullName: string; email: string; phone: string; password: string; recaptchaVerifier: any }) => {
    setIsPending(true);
    setError(null);
    try {
      let phoneNormalized = data.phone.trim();
      if (phoneNormalized.startsWith('0')) {
        phoneNormalized = '+84' + phoneNormalized.substring(1);
      }
      
      // Trigger Firebase Phone Auth
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNormalized, data.recaptchaVerifier);

      // Store temp registration data in session storage for verification step
      sessionStorage.setItem('temp_reg_data', JSON.stringify({
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        password: data.password
      }));

      return { phone: data.phone, confirmationResult, otpExpiresIn: 60 };
    } catch (err: any) {
      setError({ message: err.message || 'Registration failed' });
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending, error };
}

export function useSendCustomerOtp() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<{ message?: string } | null>(null);

  const mutateAsync = async (data: { phone: string; recaptchaVerifier: any }) => {
    setIsPending(true);
    setError(null);
    try {
      let phoneNormalized = data.phone.trim();
      if (phoneNormalized.startsWith('0')) {
        phoneNormalized = '+84' + phoneNormalized.substring(1);
      }
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNormalized, data.recaptchaVerifier);
      return { confirmationResult, otpExpiresIn: 60 };
    } catch (err: any) {
      setError({ message: err.message || 'Failed to resend OTP' });
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending, error };
}

export function useVerifyCustomerOtp() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<{ message?: string } | null>(null);
  const { register } = useAuth();

  const mutateAsync = async (data: { otp: string; confirmationResult: any }) => {
    setIsPending(true);
    setError(null);
    try {
      if (!data.confirmationResult) {
        throw new Error('Không tìm thấy phiên xác thực OTP. Vui lòng gửi lại.');
      }
      
      // Confirm the OTP code via Firebase SDK
      const userCredential = await data.confirmationResult.confirm(data.otp);
      const firebaseToken = await userCredential.user.getIdToken();

      // Retrieve temp data and actually register
      const stored = sessionStorage.getItem('temp_reg_data');
      if (!stored) {
        throw new Error('Registration data lost. Please register again.');
      }
      const regData = JSON.parse(stored);
      
      const regResult = await register(regData.fullName, regData.phone, regData.email, regData.password, firebaseToken);
      if (!regResult.success) {
        throw new Error(regResult.error || 'Registration failed after OTP verify');
      }

      sessionStorage.removeItem('temp_reg_data');
      return { success: true };
    } catch (err: any) {
      setError({ message: err.message || 'Verification failed' });
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending, error };
}
