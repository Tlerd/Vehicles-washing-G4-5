import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';

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

      console.warn('Bypassing Firebase Phone Auth due to missing billing config');
      const confirmationResult = {
        verificationId: 'mock-id',
        confirm: async (otp: string) => {
          if (otp === '123456') {
             return { user: { getIdToken: async () => 'mock-token' } };
          }
          throw new Error('Invalid OTP. Please enter 123456.');
        }
      };

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
      console.warn('Bypassing Firebase Phone Auth due to missing billing config');
      const confirmationResult = {
        verificationId: 'mock-id',
        confirm: async (otp: string) => {
          if (otp === '123456') {
             return { user: { getIdToken: async () => 'mock-token' } };
          }
          throw new Error('Invalid OTP. Please enter 123456.');
        }
      };
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
        throw new Error('OTP verification session was not found. Please send the code again.');
      }

      const userCredential = await data.confirmationResult.confirm(data.otp);
      const firebaseToken = await userCredential.user.getIdToken();

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
