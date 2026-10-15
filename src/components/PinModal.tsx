import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancelToBuyer: () => void;
}

const CORRECT_PIN = '132414';

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onSuccess,
  onCancelToBuyer,
}) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === CORRECT_PIN) {
      setError(false);
      setErrorMessage('');
      setPin('');
      onSuccess();
    } else {
      setError(true);
      setErrorMessage('Kode sandi salah! Akses mode penjual ditolak.');
    }
  };

  const handleQuickKey = (num: string) => {
    if (pin.length < 8) {
      setPin((prev) => prev + num);
      setError(false);
    }
  };

  const handleDeleteKey = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Dimmed backdrop */}
      <div className="fixed inset-0 bg-stone-900/70 backdrop-blur-xs transition-opacity" />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 sm:p-7 border border-stone-200 overflow-hidden text-center">
          {/* Badge Icon */}
          <div className="w-14 h-14 bg-amber-100 border border-amber-200 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-extrabold text-stone-900">
            Verifikasi Akses Penjual
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Halaman ini khusus untuk pemilik & pengelola <strong>JAJANAN KAKANG</strong>. Masukkan kode sandi untuk mengelola menu.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 text-left animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={10}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/[^0-9]/g, ''));
                  setError(false);
                }}
                placeholder="Masukkan 6 Digit PIN"
                autoFocus
                className={`w-full py-3 px-4 text-center text-xl tracking-widest font-mono font-bold bg-stone-50 border rounded-2xl focus:outline-none transition ${
                  error
                    ? 'border-red-400 focus:ring-2 focus:ring-red-400 text-red-600'
                    : 'border-stone-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-stone-900'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                title={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Quick Numeric Keypad for convenience on touch/mobile */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleQuickKey(digit)}
                  className="py-2.5 bg-stone-100 hover:bg-amber-50 active:bg-amber-100 rounded-xl text-stone-800 font-bold text-base transition-colors"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleDeleteKey}
                className="py-2.5 bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-600 rounded-xl text-xs font-semibold transition-colors"
              >
                Hapus
              </button>
              <button
                type="button"
                onClick={() => handleQuickKey('0')}
                className="py-2.5 bg-stone-100 hover:bg-amber-50 active:bg-amber-100 rounded-xl text-stone-800 font-bold text-base transition-colors"
              >
                0
              </button>
              <button
                type="submit"
                className="py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                OK
              </button>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl transition shadow flex items-center justify-center gap-2 text-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Buka Akses Pengelola</span>
            </button>
          </form>

          {/* Divert to Buyer Mode (#buyer) */}
          <div className="mt-5 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={onCancelToBuyer}
              className="w-full py-2.5 px-3 text-xs text-stone-600 hover:text-amber-800 hover:bg-stone-50 font-semibold rounded-xl flex items-center justify-center gap-1.5 transition"
            >
              <span>Saya adalah Pembeli (Masuk ke Menu Pesanan)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
