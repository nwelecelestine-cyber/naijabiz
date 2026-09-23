"use client";

import { useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  sku: string | null;
  category: string | null;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");

  const formatMoney = (amount: number) => {
    return `₦${(amount / 100).toLocaleString("en-NG")}`;
  };

  async function loadProducts() {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function addProduct() {
    setMessage("");

    if (!name.trim()) {
      setMessage("Please enter the product name.");
      return;
    }

    const productQuantity = Number(quantity);
    const productCostPrice = Number(costPrice);
    const productSellingPrice = Number(sellingPrice);

    if (!Number.isInteger(productQuantity) || productQuantity < 0) {
      setMessage("Quantity must be a valid whole number.");
      return;
    }

    if (!productCostPrice || productCostPrice < 0) {
      setMessage("Please enter a valid cost price.");
      return;
    }

    if (!productSellingPrice || productSellingPrice < 0) {
      setMessage("Please enter a valid selling price.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          sku: sku.trim() || null,
          category: category.trim() || null,
          quantity: productQuantity,
          costPrice: Math.round(productCostPrice * 100),
          sellingPrice: Math.round(productSellingPrice * 100),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.error || "Could not add product.");
        return;
      }

      setMessage("Product added successfully.");

      setProducts((currentProducts) => [
        ...currentProducts,
        data.product,
      ]);

      setName("");
      setSku("");
      setCategory("");
      setQuantity("");
      setCostPrice("");
      setSellingPrice("");

      setShowForm(false);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong while adding the product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <div className="mx-auto max-w-7xl p-5 md:p-8">

        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <a
              href="/"
              className="text-sm text-gray-500 hover:text-black"
            >
              ← Back to Dashboard
            </a>

            <h1 className="mt-4 text-3xl font-bold">
              Inventory
            </h1>

            <p className="mt-2 text-gray-500">
              Manage your products and monitor your stock.
            </p>
          </div>

          <button
            onClick={() => {
              setShowForm(true);
              setMessage("");
            }}
            className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            + Add Product
          </button>

        </div>

        {/* ADD PRODUCT FORM */}
        {showForm && (
          <div className="mb-8 rounded-xl border bg-white p-6">

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Add New Product
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Enter the details of your product.
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-black"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">

              {/* PRODUCT NAME */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Product Name
                </label>

                <input
                  type="text"
                  placeholder="e.g. Rice"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
                />
              </div>

              {/* SKU */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  SKU
                </label>

                <input
                  type="text"
                  placeholder="e.g. RICE-001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
                />
              </div>

              {/* CATEGORY */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Category
                </label>

                <input
                  type="text"
                  placeholder="e.g. Food"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
                />
              </div>

              {/* QUANTITY */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Quantity
                </label>

                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 20"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
                />
              </div>

              {/* COST PRICE */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Cost Price (₦)
                </label>

                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 50000"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
                />
              </div>

              {/* SELLING PRICE */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Selling Price (₦)
                </label>

                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 60000"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
                />
              </div>

            </div>

            {message && (
              <div className="mt-5 rounded-lg bg-gray-100 p-4 text-sm">
                {message}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">

              <button
                onClick={() => setShowForm(false)}
                disabled={saving}
                className="rounded-lg border px-5 py-3 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={addProduct}
                disabled={saving}
                className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Adding Product..." : "Add Product"}
              </button>

            </div>

          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <SummaryCard
            title="Total Products"
            value={products.length.toString()}
            detail="Products in inventory"
          />

          <SummaryCard
            title="Total Units"
            value={products
              .reduce((sum, product) => sum + product.quantity, 0)
              .toString()}
            detail="Units currently in stock"
          />

          <SummaryCard
            title="Inventory Cost"
            value={formatMoney(
              products.reduce(
                (sum, product) =>
                  sum + product.costPrice * product.quantity,
                0
              )
            )}
            detail="Cost value of stock"
          />

          <SummaryCard
            title="Stock Value"
            value={formatMoney(
              products.reduce(
                (sum, product) =>
                  sum + product.sellingPrice * product.quantity,
                0
              )
            )}
            detail="Potential sales value"
          />

        </div>

        {/* PRODUCT TABLE */}
        <div className="mt-8 rounded-xl border bg-white">

          <div className="border-b p-6">
            <h2 className="text-lg font-semibold">
              Products
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              All products currently registered in your business.
            </p>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-gray-500">
              Loading inventory...
            </div>
          ) : products.length === 0 ? (
            <div className="p-10 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-2xl">
                ▣
              </div>

              <h3 className="mt-4 text-lg font-semibold">
                No products yet
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Add your first product to start managing inventory.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead className="border-b bg-gray-50 text-sm text-gray-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">
                      Product
                    </th>

                    <th className="px-6 py-4 font-medium">
                      SKU
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Category
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Stock
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Cost Price
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Selling Price
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >

                      <td className="px-6 py-5">
                        <p className="font-semibold">
                          {product.name}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          Product #{product.id}
                        </p>
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600">
                        {product.sku || "—"}
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600">
                        {product.category || "—"}
                      </td>

                      <td className="px-6 py-5">
                        <span className="font-semibold">
                          {product.quantity}
                        </span>

                        <span className="ml-1 text-sm text-gray-500">
                          units
                        </span>
                      </td>

                      <td className="px-6 py-5 text-sm font-medium">
                        {formatMoney(product.costPrice)}
                      </td>

                      <td className="px-6 py-5 text-sm font-medium">
                        {formatMoney(product.sellingPrice)}
                      </td>

                      <td className="px-6 py-5">
                        <StockStatus
                          quantity={product.quantity}
                        />
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>
    </main>
  );
}


/* SUMMARY CARD */

function SummaryCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-6">

      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p className="mt-3 text-2xl font-bold">
        {value}
      </p>

      <p className="mt-2 text-sm text-gray-500">
        {detail}
      </p>

    </div>
  );
}


/* STOCK STATUS */

function StockStatus({
  quantity,
}: {
  quantity: number;
}) {
  if (quantity === 0) {
    return (
      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
        Out of stock
      </span>
    );
  }

  if (quantity <= 5) {
    return (
      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
        Low stock
      </span>
    );
  }

  return (
    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
      In stock
    </span>
  );
}