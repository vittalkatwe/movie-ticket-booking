import { useState, useEffect } from 'react';
import { Armchair, CheckCircle2, XCircle, Loader2, User, Mail, Phone, ArrowRight, ArrowLeft, ShoppingCart } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080';

interface Seat {
  id: number;
  seatNumber: string;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED';
  price: number;
}

interface UserDetails {
  name: string;
  email: string;
  phone: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

type Page = 'seats' | 'preview' | 'details' | 'payment';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('seats');
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: '',
    email: '',
    phone: ''
  });

  const fetchSeats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/seats`);
      const data = await response.json();
      setSeats(data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load seats. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeats();
  }, []);

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'BOOKED' || seat.status === 'HELD') {
      setMessage({ type: 'error', text: 'This seat is not available!' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const isSelected = selectedSeats.find(s => s.id === seat.id);
    if (isSelected) {
      setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const getTotalPrice = () => {
    return selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  };

  const handleContinueToPreview = () => {
    if (selectedSeats.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one seat!' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    setCurrentPage('preview');
  };

  const handleContinueToDetails = () => {
    setCurrentPage('details');
  };

  const handleSubmitDetails = async () => {
    if (!userDetails.name || !userDetails.email || !userDetails.phone) {
      setMessage({ type: 'error', text: 'Please fill all details!' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userDetails.email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email!' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      setBookingInProgress(true);
      const seatIds = selectedSeats.map(s => s.id);
      
      const holdResponse = await fetch(`${API_BASE_URL}/seats/hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatIds, userDetails })
      });

      const holdData = await holdResponse.json();

      if (!holdData.success) {
        setMessage({ type: 'error', text: 'Some seats are no longer available. Please select again.' });
        await fetchSeats();
        setSelectedSeats([]);
        setCurrentPage('seats');
        setBookingInProgress(false);
        return;
      }

      setCurrentPage('payment');
      initiatePayment(holdData.holdIds);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: 'Failed to hold seats. Please try again.'
      });
      setBookingInProgress(false);
    }
  };

  const initiatePayment = async (holdIds: number[]) => {
    try {
      const orderResponse = await fetch(`${API_BASE_URL}/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: getTotalPrice(), holdIds })
      });

      const orderData = await orderResponse.json();
      const { orderId, amount, currency, key } = orderData;

      const options = {
        key: key,
        amount: amount,
        currency: currency,
        order_id: orderId,
        name: 'Movie Seat Booking',
        description: `Booking for ${selectedSeats.length} seat(s)`,
        prefill: {
          name: userDetails.name,
          email: userDetails.email,
          contact: userDetails.phone
        },
        handler: async function (response: any) {
          try {
            await fetch(`${API_BASE_URL}/payment/confirm`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                holdIds,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature
              })
            });

            setMessage({
              type: 'success',
              text: `Successfully booked ${selectedSeats.length} seat(s)!`
            });
            
            setSelectedSeats([]);
            setUserDetails({ name: '', email: '', phone: '' });
            setCurrentPage('seats');
            await fetchSeats();
          } catch (error) {
            setMessage({
              type: 'error',
              text: 'Payment confirmation failed. Please contact support.'
            });
          } finally {
            setBookingInProgress(false);
          }
        },
        modal: {
          ondismiss: async function () {
            setMessage({ type: 'error', text: 'Payment cancelled. Seats will be released.' });
            setBookingInProgress(false);
            setCurrentPage('seats');
            setSelectedSeats([]);
            await fetchSeats();
          },
        },
        theme: {
          color: '#3b82f6',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: 'Payment initiation failed.'
      });
      setBookingInProgress(false);
      setCurrentPage('seats');
    }
  };

  const renderSeatsPage = () => (
    <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 shadow-2xl border border-slate-700">
      <div className="mb-6 flex items-center justify-center gap-8 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500 rounded-lg"></div>
          <span className="text-slate-300">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg"></div>
          <span className="text-slate-300">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-500 rounded-lg"></div>
          <span className="text-slate-300">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-500 rounded-lg"></div>
          <span className="text-slate-300">Held</span>
        </div>
      </div>

      <div className="mb-8 h-16 bg-slate-700 rounded-t-3xl flex items-center justify-center">
        <span className="text-slate-400 font-semibold tracking-wider">SCREEN</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
          {seats.map((seat) => {
            const isSelected = selectedSeats.find(s => s.id === seat.id);
            return (
              <button
                key={seat.id}
                onClick={() => handleSeatClick(seat)}
                disabled={seat.status === 'BOOKED' || seat.status === 'HELD'}
                className={`
                  aspect-square rounded-lg font-semibold text-xs
                  transition-all duration-200 transform flex flex-col items-center justify-center
                  ${
                    isSelected
                      ? 'bg-blue-500 hover:bg-blue-600 scale-105 text-white shadow-lg shadow-blue-500/50'
                      : seat.status === 'AVAILABLE'
                      ? 'bg-green-500 hover:bg-green-600 hover:scale-105 text-white shadow-lg shadow-green-500/50'
                      : (seat.status === 'BOOKED' ? 'bg-red-500 cursor-not-allowed text-white opacity-60' : 'bg-gray-500 cursor-not-allowed text-white opacity-60')
                  }
                `}
              >
                <div>{seat.seatNumber}</div>
                <div className="text-[10px]">₹{seat.price}</div>
              </button>
            );
          })}
        </div>
      )}

      {selectedSeats.length > 0 && (
        <div className="mt-8 p-4 bg-slate-700/50 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-300">Selected Seats ({selectedSeats.length})</span>
            <span className="text-xl font-bold text-white">₹{getTotalPrice()}</span>
          </div>
          <button
            onClick={handleContinueToPreview}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            Continue <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );

  const renderPreviewPage = () => (
    <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 shadow-2xl border border-slate-700">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <ShoppingCart className="w-6 h-6" /> Booking Summary
      </h2>

      <div className="space-y-4 mb-6">
        <div className="bg-slate-700/50 rounded-lg p-4">
          <h3 className="text-slate-300 font-semibold mb-3">Selected Seats</h3>
          <div className="flex flex-wrap gap-2">
            {selectedSeats.map(seat => (
              <div key={seat.id} className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm">
                {seat.seatNumber} - ₹{seat.price}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-300">Number of Seats</span>
            <span className="text-white font-semibold">{selectedSeats.length}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-300">Subtotal</span>
            <span className="text-white font-semibold">₹{getTotalPrice()}</span>
          </div>
          <div className="border-t border-slate-600 mt-2 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-white font-bold">Total Amount</span>
              <span className="text-2xl text-blue-400 font-bold">₹{getTotalPrice()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setCurrentPage('seats')}
          className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <button
          onClick={handleContinueToDetails}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          Continue <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderDetailsPage = () => (
    <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 shadow-2xl border border-slate-700">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <User className="w-6 h-6" /> Your Details
      </h2>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-slate-300 mb-2 font-medium">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={userDetails.name}
              onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
              className="w-full bg-slate-700 text-white pl-10 pr-4 py-3 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
              placeholder="Enter your full name"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-300 mb-2 font-medium">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="email"
              value={userDetails.email}
              onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
              className="w-full bg-slate-700 text-white pl-10 pr-4 py-3 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
              placeholder="your.email@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-300 mb-2 font-medium">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="tel"
              value={userDetails.phone}
              onChange={(e) => setUserDetails({ ...userDetails, phone: e.target.value })}
              className="w-full bg-slate-700 text-white pl-10 pr-4 py-3 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
              placeholder="+91 1234567890"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-slate-300">Total Amount</span>
          <span className="text-2xl text-blue-400 font-bold">₹{getTotalPrice()}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setCurrentPage('preview')}
          disabled={bookingInProgress}
          className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <button
          onClick={handleSubmitDetails}
          disabled={bookingInProgress}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {bookingInProgress ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Processing...
            </>
          ) : (
            <>
              Proceed to Payment <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderPaymentPage = () => (
    <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 shadow-2xl border border-slate-700">
      <div className="text-center py-12">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Processing Payment. Please wait a few seconds...</h2>
        <p className="text-slate-300">Please complete the payment in the Razorpay window</p>
        <p className="text-slate-400 text-sm mt-4">Seats are held for 6 minutes</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
              <Armchair className="w-10 h-10" />
              Movie Seat Booking
            </h1>
            <p className="text-slate-300">Select your seats and complete the booking</p>
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                message.type === 'success'
                  ? 'bg-green-500/20 border border-green-500/50 text-green-100'
                  : 'bg-red-500/20 border border-red-500/50 text-red-100'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {currentPage === 'seats' && renderSeatsPage()}
          {currentPage === 'preview' && renderPreviewPage()}
          {currentPage === 'details' && renderDetailsPage()}
          {currentPage === 'payment' && renderPaymentPage()}

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Running in TEST mode. Use Razorpay test cards for payment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;