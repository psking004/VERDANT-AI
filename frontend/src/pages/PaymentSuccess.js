import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:8001' : '');
const API = `${BACKEND_URL}/api`;

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking');
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      pollPaymentStatus(sessionId);
    } else {
      setStatus('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 5;

    if (attempts >= maxAttempts) {
      setStatus('timeout');
      return;
    }

    try {
      const response = await axios.get(`${API}/payments/status/${sessionId}`);
      
      if (response.data.payment_status === 'paid') {
        setPaymentDetails(response.data);
        setStatus('success');
        // Clear cart
        localStorage.removeItem('verdant_cart');
      } else if (response.data.status === 'expired') {
        setStatus('expired');
      } else {
        // Continue polling
        setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setStatus('error');
    }
  };

  if (status === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center min-h-96" data-testid="payment-checking">
        <Loader2 className="animate-spin text-[#064E3B] mb-4" size={48} />
        <p className="text-lg text-slate-700">Verifying your payment...</p>
        <p className="text-sm text-slate-500 mt-2">Please wait while we confirm your transaction</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="max-w-2xl mx-auto" data-testid="payment-success">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600" size={40} />
          </div>

          <h2 className="text-3xl font-semibold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Payment Successful!
          </h2>
          <p className="text-slate-600 mb-8">
            Thank you for your purchase. Your order has been confirmed.
          </p>

          {paymentDetails && (
            <div className="bg-slate-50 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-slate-900 mb-4">Payment Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Amount Paid:</span>
                  <span className="font-semibold text-slate-900">
                    ₹{(paymentDetails.amount_total / 100).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Payment Status:</span>
                  <span className="font-semibold text-green-600 capitalize">
                    {paymentDetails.payment_status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Currency:</span>
                  <span className="font-semibold text-slate-900 uppercase">
                    {paymentDetails.currency}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => navigate('/marketplace')}
              variant="outline"
              data-testid="continue-shopping-button"
            >
              Continue Shopping
            </Button>
            <Button
              onClick={() => navigate('/')}
              className="bg-[#064E3B] hover:bg-[#065F46]"
              data-testid="go-to-dashboard-button"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto" data-testid="payment-error">
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-red-600 text-4xl">×</span>
        </div>

        <h2 className="text-3xl font-semibold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Payment {status === 'timeout' ? 'Verification Timeout' : status === 'expired' ? 'Expired' : 'Failed'}
        </h2>
        <p className="text-slate-600 mb-8">
          {status === 'timeout'
            ? 'Payment verification took too long. Please check your email for confirmation.'
            : status === 'expired'
            ? 'Your payment session has expired. Please try again.'
            : 'There was an issue processing your payment. Please try again.'}
        </p>

        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => navigate('/marketplace')}
            className="bg-[#064E3B] hover:bg-[#065F46]"
            data-testid="retry-payment-button"
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;