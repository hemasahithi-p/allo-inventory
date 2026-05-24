"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

export default function ReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [reservation, setReservation] = useState<any>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reservations/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setReservation(data);
        const diff = Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000);
        setSecondsLeft(Math.max(0, diff));
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  async function confirm() {
    setError("");
    const res = await fetch(`/api/reservations/${id}/confirm`, { method: "POST" });
    const data = await res.json();
    if (res.status === 410) { setError("Reservation expired before you could confirm."); return; }
    if (!res.ok) { setError(data.error || "Something went wrong."); return; }
    setReservation((r: any) => ({ ...r, status: "CONFIRMED" }));
  }

  async function cancel() {
    await fetch(`/api/reservations/${id}/release`, { method: "POST" });
    router.push("/");
  }

  if (loading) return <div className="p-8 text-gray-300">Loading...</div>;
  if (!reservation) return <div className="p-8 text-red-400">Reservation not found.</div>;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <main className="max-w-md mx-auto p-8 text-white">
      <h1 className="text-2xl font-semibold mb-6">Checkout</h1>

      <div className="border border-gray-700 rounded-lg p-6 space-y-4 bg-gray-900 shadow-lg">

        <div>
          <p className="text-sm text-gray-400">Product</p>
          <p className="font-medium text-gray-200">{reservation.product?.name}</p>
        </div>

        <div>
          <p className="text-sm text-gray-400">Warehouse</p>
          <p className="font-medium text-gray-200">{reservation.warehouse?.name}</p>
        </div>

        <div>
          <p className="text-sm text-gray-400">Quantity</p>
          <p className="font-medium text-gray-200">{reservation.quantity}</p>
        </div>

        <div>
          <p className="text-sm text-gray-400">Status</p>
          <p className={`font-medium ${
            reservation.status === "CONFIRMED" ? "text-green-400" :
            reservation.status === "RELEASED" ? "text-red-400" : "text-blue-400"
          }`}>
            {reservation.status}
          </p>
        </div>

        {reservation.status === "PENDING" && (
          <div className={`p-3 rounded text-sm font-medium ${
            secondsLeft < 60
              ? "bg-red-900 text-red-300"
              : "bg-blue-900 text-blue-300"
          }`}>
            ⏳ Time remaining: {mins}:{secs.toString().padStart(2, "0")}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-900 border border-red-700 text-red-300 rounded">
            {error}
          </div>
        )}

        {reservation.status === "CONFIRMED" && (
          <div className="p-3 bg-green-900 border border-green-700 text-green-300 rounded">
            ✅ Payment confirmed! Your order has been placed.
          </div>
        )}

        {reservation.status === "PENDING" && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={confirm}
              className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Confirm purchase
            </button>

            <button
              onClick={cancel}
              className="flex-1 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-800 transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => router.push("/")}
        className="mt-4 text-sm text-gray-400 hover:text-gray-200 transition"
      >
        ← Back to products
      </button>
    </main>
  );
}