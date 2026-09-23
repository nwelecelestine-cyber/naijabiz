"use client";

import { useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  quantity: number;
  sellingPrice: number;
};

type Customer = {
  id: number;
  name: string;
  phone: string | null;
};

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [productId, setProductId] = useState("");
  const [customerId, setCustomerId] = useState("");

  const [quantity, setQuantity] = useState(1);
  const [amountPaid, setAmountPaid] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [productsResponse, customersResponse] =
          await Promise.all([
            fetch("/api/products"),
            fetch("/api/customers"),
          ]);

        const productsData = await productsResponse.json();
        const customersData = await customersResponse.json();

        if (productsData.success) {
          setProducts(productsData.products);
        }

        if (customersData.success) {
          setCustomers(customersData.customers);
        }
      } catch (error) {
        console.error("Failed to load sales data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const selectedProduct = products.find(
    (product) => product.id === Number(productId)
  );

  const selectedCustomer = customers.find(
    (customer) => customer.id === Number(customerId)
  );

  const totalAmount =
    selectedProduct && quantity > 0
      ? selectedProduct.sellingPrice * quantity
      : 0;

  const paidAmount = Number(amountPaid || 0);

  const balance = Math.max(totalAmount - paidAmount, 0);

  const formatMoney = (amount: number) => {
    return `₦${(amount / 100).toLocaleString("en-NG")}`;
  };

  async function recordSale() {
    setMessage("");

    if (!productId) {
      setMessage("Please select a product.");
      return;
    }

    if (quantity <= 0) {
      setMessage("Quantity must be greater than 0.");
      return;
    }

    if (selectedProduct && quantity > selectedProduct.quantity) {
      setMessage("Insufficient stock.");
      return;
    }

    if (paidAmount > totalAmount) {
      setMessage("Amount paid cannot be greater than the sale total.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: Number(productId),
          customerId: customerId
            ? Number(customerId)
            : null,
          quantity,
          amountPaid: paidAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.error || "Could not record sale.");
        return;
      }

      setMessage(
        `Sale recorded successfully. ${
          data.product.name
        } now has ${data.product.newQuantity} in stock.`
      );

      setProductId("");
      setCustomerId("");
      setQuantity(1);
      setAmountPaid("");

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === data.product.id
            ? {
                ...product,
                quantity: data.product.newQuantity,
              }
            : product
        )
      );
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <div className="mx-auto max-w-5xl p-5 md:p-8">

        {/* HEADER */}
        <div className="mb-8">

          <a
            href="/"
            className="text-sm text-gray-500 hover:text-black"
          >
            ← Back to Dashboard
          </a>

          <h1 className="mt-4 text-3xl font-bold">
            Record Sale
          </h1>

          <p className="mt-2 text-gray-500">
            Record a customer sale and automatically update your inventory.
          </p>

        </div>

        <div className="grid gap-6 lg:grid-cols-3">

          {/* FORM */}
          <div className="rounded-xl border bg-white p-6 lg:col-span-2">

            <h2 className="text-xl font-semibold">
              Sale Details
            </h2>

            <div className="mt-6 space-y-5">

              {/* PRODUCT */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Product
                </label>

                {loading ? (
                  <p className="text-sm text-gray-500">
                    Loading products...
                  </p>
                ) : (
                  <select
                    value={productId}
                    onChange={(e) =>
                      setProductId(e.target.value)
                    }
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
                  >
                    <option value="">
                      Select a product
                    </option>

                    {products.map((product) => (
                      <option
                        key={product.id}
                        value={product.id}
                        disabled={product.quantity === 0}
                      >
                        {product.name} — {product.quantity} in stock
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* CUSTOMER */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Customer
                </label>

                {loading ? (
                  <p className="text-sm text-gray-500">
                    Loading customers...
                  </p>
                ) : (
                  <select
                    value={customerId}
                    onChange={(e) =>
                      setCustomerId(e.target.value)
                    }
                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
                  >
                    <option value="">
                      Walk-in Customer / No Customer
                    </option>

                    {customers.map((customer) => (
                      <option
                        key={customer.id}
                        value={customer.id}
                      >
                        {customer.name}
                        {customer.phone
                          ? ` — ${customer.phone}`
                          : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* QUANTITY */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Number(e.target.value))
                  }
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
                />
              </div>

              {/* AMOUNT PAID */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Amount Paid (₦)
                </label>

                <input
                  type="number"
                  min="0"
                  placeholder="Enter amount paid"
                  value={
                    amountPaid
                      ? Number(amountPaid) / 100
                      : ""
                  }
                  onChange={(e) => {
                    const naira = Number(e.target.value);

                    setAmountPaid(
                      naira > 0
                        ? String(Math.round(naira * 100))
                        : ""
                    );
                  }}
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Leave as 0 for an unpaid sale.
                </p>
              </div>

            </div>

            {message && (
              <div className="mt-6 rounded-lg bg-gray-100 p-4 text-sm">
                {message}
              </div>
            )}

            <button
              onClick={recordSale}
              disabled={saving}
              className="mt-6 w-full rounded-lg bg-black px-4 py-3 font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Recording Sale..." : "Record Sale"}
            </button>

          </div>

          {/* SUMMARY */}
          <div className="rounded-xl bg-black p-6 text-white">

            <p className="text-sm text-gray-400">
              Sale Summary
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              {selectedProduct?.name || "No product selected"}
            </h2>

            <div className="mt-8 space-y-5">

              {/* CUSTOMER */}
              <div>
                <p className="text-sm text-gray-400">
                  Customer
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {selectedCustomer?.name || "Walk-in Customer"}
                </p>
              </div>

              {/* UNIT PRICE */}
              <div>
                <p className="text-sm text-gray-400">
                  Unit price
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {selectedProduct
                    ? formatMoney(
                        selectedProduct.sellingPrice
                      )
                    : "₦0"}
                </p>
              </div>

              {/* QUANTITY */}
              <div>
                <p className="text-sm text-gray-400">
                  Quantity
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {quantity}
                </p>
              </div>

              {/* TOTAL */}
              <div className="border-t border-gray-700 pt-5">

                <p className="text-sm text-gray-400">
                  Total
                </p>

                <p className="mt-1 text-3xl font-bold">
                  {formatMoney(totalAmount)}
                </p>

              </div>

              {/* PAID */}
              <div>
                <p className="text-sm text-gray-400">
                  Amount paid
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {formatMoney(paidAmount)}
                </p>
              </div>

              {/* BALANCE */}
              <div>
                <p className="text-sm text-gray-400">
                  Balance
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {formatMoney(balance)}
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>
    </main>
  );
}