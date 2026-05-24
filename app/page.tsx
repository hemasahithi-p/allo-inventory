"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reserving, setReserving] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => { setProducts(data); setLoading(false); });
  }, []);

  async function reserve(productId: string, warehouseId: string) {
    setReserving(productId + warehouseId);
    setError("");
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, warehouseId, quantity: 1 }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to reserve");
      setReserving("");
      return;
    }
    router.push(`/reservations/${data.id}`);
  }

  if (loading) return <div className="p-8">Loading products...</div>;

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-2">Products</h1>
      <p className="text-gray-500 mb-6">Select a product and warehouse to reserve</p>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}
      <div className="space-y-4">
        {products.map((p) => (
          <div key={p.id} className="border rounded-lg p-4">
            <h2 className="font-medium text-lg">{p.name}</h2>
            {p.description && (
              <p className="text-gray-500 text-sm mb-3">{p.description}</p>
            )}
            <div className="space-y-2">
              {p.stockLevels.map((sl: any) => (
                <div key={sl.id} className="flex items-center justify-between bg-gray-50 rounded p-2">
                  <div>
                    <span className="font-medium text-sm">{sl.warehouse.name}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      {sl.availableUnits} units available
                    </span>
                  </div>
                  <button
                    onClick={() => reserve(p.id, sl.warehouseId)}
                    disabled={sl.availableUnits === 0 || reserving === p.id + sl.warehouseId}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {reserving === p.id + sl.warehouseId ? "Reserving..." : "Reserve"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}