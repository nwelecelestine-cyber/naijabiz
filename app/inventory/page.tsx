"use client";

import { useEffect, useMemo, useState } from "react";

type Product = {
  id: number;
  name: string;
  sku: string | null;
  category: string | null;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  createdAt?: string;
  updatedAt?: string;
};

function formatMoney(amount: number) {
  return `₦${(amount / 100).toLocaleString("en-NG")}`;
}

function formatDateTime(date?: string) {
  if (!date) return "—";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "—";
  }

  return value.toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [deletingProduct, setDeletingProduct] =
    useState<Product | null>(null);

  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");

  async function loadProducts() {
    try {
      setLoading(true);

      const response = await fetch("/api/products");
      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
      } else {
        setMessage(data.error || "Could not load products.");
      }
    } catch (error) {
      console.error("Failed to load products:", error);
      setMessage("Could not load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function resetForm() {
    setName("");
    setSku("");
    setCategory("");
    setQuantity("");
    setCostPrice("");
    setSellingPrice("");
    setEditingProduct(null);
    setShowForm(false);
  }

  function openAddForm() {
    setMessage("");
    setEditingProduct(null);
    setName("");
    setSku("");
    setCategory("");
    setQuantity("");
    setCostPrice("");
    setSellingPrice("");
    setShowForm(true);
  }

  function openEditForm(product: Product) {
    setMessage("");
    setEditingProduct(product);

    setName(product.name);
    setSku(product.sku ?? "");
    setCategory(product.category ?? "");
    setQuantity(String(product.quantity));
    setCostPrice(String(product.costPrice / 100));
    setSellingPrice(String(product.sellingPrice / 100));

    setShowForm(true);
  }

  function validateProduct() {
    if (!name.trim()) {
      setMessage("Please enter the product name.");
      return null;
    }

    const productQuantity = Number(quantity);
    const productCostPrice = Number(costPrice);
    const productSellingPrice = Number(sellingPrice);

    if (
      !Number.isInteger(productQuantity) ||
      productQuantity < 0
    ) {
      setMessage("Quantity must be a valid whole number.");
      return null;
    }

    if (
      !Number.isFinite(productCostPrice) ||
      productCostPrice < 0
    ) {
      setMessage("Please enter a valid cost price.");
      return null;
    }

    if (
      !Number.isFinite(productSellingPrice) ||
      productSellingPrice < 0
    ) {
      setMessage("Please enter a valid selling price.");
      return null;
    }

    return {
      quantity: productQuantity,
      costPrice: Math.round(productCostPrice * 100),
      sellingPrice: Math.round(productSellingPrice * 100),
    };
  }

  async function addProduct() {
    setMessage("");

    const validated = validateProduct();

    if (!validated) return;

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
          quantity: validated.quantity,
          costPrice: validated.costPrice,
          sellingPrice: validated.sellingPrice,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.error || "Could not add product.");
        return;
      }

      setProducts((currentProducts) => [
        ...currentProducts,
        data.product,
      ]);

      resetForm();
      setMessage("Product added successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong while adding the product.");
    } finally {
      setSaving(false);
    }
  }

  async function updateProduct() {
    if (!editingProduct) return;

    setMessage("");

    const validated = validateProduct();

    if (!validated) return;

    setSaving(true);

    try {
      const response = await fetch("/api/products", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingProduct.id,
          name: name.trim(),
          sku: sku.trim() || null,
          category: category.trim() || null,
          quantity: validated.quantity,
          costPrice: validated.costPrice,
          sellingPrice: validated.sellingPrice,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.error || "Could not update product.");
        return;
      }

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === editingProduct.id
            ? data.product
            : product
        )
      );

      resetForm();
      setMessage("Product updated successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong while updating the product.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct() {
    if (!deletingProduct) return;

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/products", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: deletingProduct.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.error || "Could not delete product.");
        setDeletingProduct(null);
        return;
      }

      setProducts((currentProducts) =>
        currentProducts.filter(
          (product) => product.id !== deletingProduct.id
        )
      );

      setDeletingProduct(null);
      setMessage("Product deleted successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong while deleting the product.");
    } finally {
      setSaving(false);
    }
  }

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return products;
    }

    return products.filter((product) =>
      [
        product.name,
        product.sku,
        product.category,
        String(product.id),
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(term)
        )
    );
  }, [products, search]);

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
              Manage your products, prices and stock levels.
            </p>
          </div>

          <button
            onClick={openAddForm}
            className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            + Add Product
          </button>
        </div>

        {/* MESSAGE */}
        {message && (
          <div className="mb-6 rounded-lg border bg-white p-4 text-sm">
            {message}
          </div>
        )}

        {/* ADD / EDIT FORM */}
        {showForm && (
          <div className="mb-8 rounded-xl border bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {editingProduct
                    ? "Edit Product"
                    : "Add New Product"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingProduct
                    ? "Update the product information."
                    : "Enter the product information."}
                </p>
              </div>

              <button
                onClick={resetForm}
                disabled={saving}
                className="rounded-lg px-3 py-2 text-xl text-gray-500 hover:bg-gray-100 hover:text-black disabled:opacity-50"
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">

              {/* NAME */}
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

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={resetForm}
                disabled={saving}
                className="rounded-lg border px-5 py-3 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={
                  editingProduct
                    ? updateProduct
                    : addProduct
                }
                disabled={saving}
                className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? editingProduct
                    ? "Saving Changes..."
                    : "Adding Product..."
                  : editingProduct
                    ? "Save Changes"
                    : "Add Product"}
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
              .reduce(
                (sum, product) => sum + product.quantity,
                0
              )
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
                  sum +
                  product.sellingPrice * product.quantity,
                0
              )
            )}
            detail="Potential sales value"
          />
        </div>

        {/* PRODUCT TABLE */}
        <div className="mt-8 rounded-xl border bg-white">
          <div className="border-b p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Products
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  All products currently registered in your business.
                </p>
              </div>

              <div className="w-full lg:max-w-sm">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-gray-500">
              Loading inventory...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-2xl">
                ▣
              </div>

              <h3 className="mt-4 text-lg font-semibold">
                {search
                  ? "No matching products"
                  : "No products yet"}
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                {search
                  ? "Try a different search term."
                  : "Add your first product to start managing inventory."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1350px] text-left">
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

                    <th className="px-6 py-4 font-medium">
                      Updated
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map((product) => (
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

                        {product.createdAt && (
                          <p className="mt-1 text-xs text-gray-400">
                            Added {formatDateTime(product.createdAt)}
                          </p>
                        )}
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

                      <td className="px-6 py-5 text-sm text-gray-600">
                        {formatDateTime(product.updatedAt)}
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              openEditForm(product)
                            }
                            className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              setDeletingProduct(product)
                            }
                            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* DELETE CONFIRMATION */}
        {deletingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="text-xl font-bold">
                Delete Product?
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                Are you sure you want to delete{" "}
                <strong>{deletingProduct.name}</strong>?
                This action cannot be undone.
              </p>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setDeletingProduct(null)}
                  disabled={saving}
                  className="rounded-lg border px-5 py-3 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={deleteProduct}
                  disabled={saving}
                  className="rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? "Deleting..." : "Delete Product"}
                </button>
              </div>
            </div>
          </div>
        )}
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