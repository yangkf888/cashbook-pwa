"use client";

import { useState } from "react";
import Link from "next/link";

export default function NewSpacePage() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });

    const data = await response.json().catch(() => null);

    setLoading(false);

    if (!response.ok) {
      const message =
        typeof data?.error === "string" ? data.error : "创建失败";
      setError(message);
      return;
    }

    setSuccess("家庭账本已创建");
    setName("");
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">新建家庭账本</h1>
        <p className="mt-2 text-sm text-slate-600">
          仅需填写名称，创建后自动成为 owner。
        </p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor="name">名称</label>
          <input
            id="name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        {error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}
        <button type="submit" disabled={loading}>
          {loading ? "创建中..." : "创建"}
        </button>
      </form>
      <Link className="text-sm font-medium text-slate-900 underline" href="/app">
        返回首页
      </Link>
    </div>
  );
}
