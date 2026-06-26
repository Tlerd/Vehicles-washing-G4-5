import { useState } from 'react';
import { authService } from '../../../services/customer/auth.service';
import { useAuth } from '../../../context/AuthContext';

export function useCustomerRegister() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<{ message?: string } | null>(null);

  const mutateAsync = async (data: { fullName: string; email: string; phone: string; password: string }) => {
    setIsPending(true);
    setError(null);
    try {
      // Delay for realistic feel
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const { success, otpExpiresIn } = authService.sendOtp(data.email);
      if (!success) {
        throw new Error('Failed to send OTP');
      }

      // Store temp registration data in session storage for verification step
      sessionStorage.setItem('temp_reg_data', JSON.stringify(data));

      return { email: data.email, otpExpiresIn: otpExpiresIn || 60 };
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

  const mutateAsync = async (data: { email: string }) => {
    setIsPending(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const { success, otpExpiresIn } = authService.sendOtp(data.email);
      if (!success) throw new Error('Failed to send OTP');
      return { otpExpiresIn: otpExpiresIn || 60 };
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

  const mutateAsync = async (data: { email: string; otp: string }) => {
    setIsPending(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const verifyResult = authService.verifyOtp(data.email, data.otp);
      
      if (!verifyResult.success) {
        throw new Error(verifyResult.error || 'Invalid OTP');
      }

      // Retrieve temp data and actually register
      const stored = sessionStorage.getItem('temp_reg_data');
      if (!stored) {
        throw new Error('Registration data lost. Please register again.');
      }
      const regData = JSON.parse(stored);
      
      const regResult = register(regData.fullName, regData.phone, regData.email, regData.password);
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
