"use client";

import { useMemo, useState } from "react";

type TransactionType = "income" | "expense";

interface TransactionItem {
  id: string;
  spaceId: string;
  type: TransactionType;
  amountCents: number;
  category: string;
  account: string;
  date: string;
  note: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

interface TransactionsClientProps {
  spaceId: string;
  userId: string;
  role: "owner" | "member" | "viewer";
  openOnLoad: boolean;
  initialTransactions: TransactionItem[];
}

const CATEGORY_OPTIONS = [
  "餐饮",
  "交通",
  "购物",
  "房租",
  "娱乐",
  "医疗",
  "工资",
  "其他"
];

const ACCOUNT_OPTIONS = [
  "现金",
  "银行卡",
  "支付宝",
  "微信",
  "信用卡"
];

const currencyFormatter = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  minimumFractionDigits: 2
});

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const formatDayLabel = (date: Date) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) {
    return "Today";
  }

  if (isSameDay(date, yesterday)) {
    return "昨天";
  }

  return date.toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
};

const getTimeValue = (date: Date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

const buildDateTime = (dateValue: string, timeValue: string) => {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute).toISOString();
};

export default function TransactionsClient({
  spaceId,
  userId,
  role,
  openOnLoad,
  initialTransactions
}: TransactionsClientProps) {
  const [transactions, setTransactions] = useState<TransactionItem[]>(
    initialTransactions
  );
  const [isOpen, setIsOpen] = useState(openOnLoad);
  const [editing, setEditing] = useState<TransactionItem | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const now = new Date();

  const defaultDate = useMemo(
    () => now.toISOString().slice(0, 10),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const defaultTime = useMemo(() => getTimeValue(now), [now]);

  const [form, setForm] = useState({
    type: "expense" as TransactionType,
    amount: "",
    category: "",
    account: "",
    date: defaultDate,
    time: defaultTime,
    note: ""
  });

  const canCreate = role !== "viewer";

  const groupedTransactions = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const map = new Map<
      string,
      { label: string; items: TransactionItem[] }
    >();
    sorted.forEach((transaction) => {
      const date = new Date(transaction.date);
      const key = date.toISOString().slice(0, 10);
      if (!map.has(key)) {
        map.set(key, { label: formatDayLabel(date), items: [] });
      }
      map.get(key)?.items.push(transaction);
    });
    return Array.from(map.values());
  }, [transactions]);

  const summary = useMemo(() => {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    const monthTransactions = transactions.filter((transaction) => {
      const date = new Date(transaction.date);
      return date >= startOfMonth && date <= endOfMonth;
    });
    const expenseTotal = monthTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + transaction.amountCents, 0);
    const incomeTotal = monthTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + transaction.amountCents, 0);
    return {
      expenseTotal,
      incomeTotal,
      balance: incomeTotal - expenseTotal
    };
  }, [now, transactions]);

  const resetForm = () => {
    setForm({
      type: "expense",
      amount: "",
      category: "",
      account: "",
      date: defaultDate,
      time: defaultTime,
      note: ""
    });
    setEditing(null);
    setError(null);
  };

  const openNewModal = () => {
    if (!canCreate) {
      return;
    }
    resetForm();
    setIsOpen(true);
  };

  const openEditModal = (transaction: TransactionItem) => {
    const date = new Date(transaction.date);
    setForm({
      type: transaction.type,
      amount: (transaction.amountCents / 100).toFixed(2),
      category: transaction.category,
      account: transaction.account,
      date: date.toISOString().slice(0, 10),
      time: getTimeValue(date),
      note: transaction.note ?? ""
    });
    setEditing(transaction);
    setError(null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditing(null);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const amountNumber = Number(form.amount);
    if (!form.category.trim() || !form.account.trim()) {
      setError("请填写分类与账户");
      return;
    }
    if (Number.isNaN(amountNumber) || amountNumber <= 0) {
      setError("请输入有效金额");
      return;
    }

    const payload = {
      type: form.type,
      amountCents: Math.round(amountNumber * 100),
      category: form.category.trim(),
      account: form.account.trim(),
      date: buildDateTime(form.date, form.time),
      note: form.note.trim() ? form.note.trim() : null
    };

    const url = editing
      ? `/api/spaces/${spaceId}/transactions/${editing.id}`
      : `/api/spaces/${spaceId}/transactions`;

    const response = await fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      setError("保存失败，请稍后重试");
      return;
    }

    const data = await response.json();
    const nextTransaction = data.transaction as TransactionItem;

    setTransactions((prev) => {
      if (editing) {
        return prev.map((item) => (item.id === nextTransaction.id ? nextTransaction : item));
      }
      return [nextTransaction, ...prev];
    });

    closeModal();
  };

  const handleDelete = async (transaction: TransactionItem) => {
    if (!confirm("确认删除这笔交易？")) {
      return;
    }

    const response = await fetch(
      `/api/spaces/${spaceId}/transactions/${transaction.id}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      setError("删除失败，请稍后重试");
      return;
    }

    setTransactions((prev) => prev.filter((item) => item.id !== transaction.id));
    setMenuOpenId(null);
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-500">本月支出</div>
            <div className="text-lg font-semibold text-rose-600">
              {currencyFormatter.format(summary.expenseTotal / 100)}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-500">本月收入</div>
            <div className="text-lg font-semibold text-emerald-600">
              {currencyFormatter.format(summary.incomeTotal / 100)}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-500">结余</div>
            <div className="text-lg font-semibold text-slate-900">
              {currencyFormatter.format(summary.balance / 100)}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">交易明细</h2>
          <button
            type="button"
            onClick={openNewModal}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              canCreate
                ? "bg-slate-900 text-white"
                : "cursor-not-allowed bg-slate-200 text-slate-500"
            }`}
          >
            + 记一笔
          </button>
        </div>

        {groupedTransactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            暂无记录，先记第一笔吧。
          </div>
        ) : (
          groupedTransactions.map((group) => (
            <div key={group.label} className="space-y-3">
              <div className="text-sm font-semibold text-slate-500">
                {group.label}
              </div>
              {group.items.map((transaction) => {
                const canEdit =
                  role === "owner" ||
                  (role === "member" && transaction.createdByUserId === userId);
                const amountValue = transaction.amountCents / 100;
                const amountText = currencyFormatter.format(amountValue);
                return (
                  <button
                    type="button"
                    key={transaction.id}
                    onClick={() => canEdit && openEditModal(transaction)}
                    className={`w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition ${
                      canEdit ? "hover:border-slate-300" : "cursor-default"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-base font-semibold text-slate-900">
                          {transaction.category}
                        </div>
                        {transaction.note ? (
                          <div className="mt-1 text-sm text-slate-500">
                            {transaction.note}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`text-base font-semibold ${
                            transaction.type === "expense"
                              ? "text-rose-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {transaction.type === "expense" ? "-" : "+"}
                          {amountText}
                        </div>
                        {canEdit ? (
                          <div
                            className="relative"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setMenuOpenId(
                                  menuOpenId === transaction.id
                                    ? null
                                    : transaction.id
                                )
                              }
                              className="rounded-full border border-slate-200 px-2 py-1 text-sm text-slate-500"
                            >
                              ⋯
                            </button>
                            {menuOpenId === transaction.id ? (
                              <div className="absolute right-0 mt-2 w-28 rounded-lg border border-slate-200 bg-white p-2 text-sm shadow-lg">
                                <button
                                  type="button"
                                  onClick={() => handleDelete(transaction)}
                                  className="w-full rounded-md px-3 py-2 text-left text-rose-600 hover:bg-rose-50"
                                >
                                  删除
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-500">
                      {transaction.account} ·{" "}
                      {new Date(transaction.date).toLocaleTimeString("zh-CN", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                  </button>
                );
              })}
            </div>
          ))
        )}
      </section>

      {isOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="flex h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="text-base font-semibold text-slate-900">
                {editing ? "编辑交易" : "新增交易"}
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-500"
              >
                关闭
              </button>
            </div>
            <form
              className="flex-1 space-y-5 overflow-y-auto px-5 py-4"
              onSubmit={handleSubmit}
            >
              <div>
                <label className="mb-2 block">类型</label>
                <div className="flex rounded-full border border-slate-200 bg-slate-100 p-1">
                  {["expense", "income"].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          type: value as TransactionType
                        }))
                      }
                      className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${
                        form.type === value
                          ? "bg-white text-slate-900 shadow"
                          : "text-slate-500"
                      }`}
                    >
                      {value === "expense" ? "支出" : "收入"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block">金额（元）</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, amount: event.target.value }))
                  }
                  className="text-base"
                  placeholder="请输入金额"
                />
              </div>

              <div>
                <label className="mb-2 block">分类</label>
                <input
                  list="category-options"
                  value={form.category}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, category: event.target.value }))
                  }
                  className="text-base"
                  placeholder="例如：餐饮"
                />
                <datalist id="category-options">
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="mb-2 block">账户</label>
                <input
                  list="account-options"
                  value={form.account}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, account: event.target.value }))
                  }
                  className="text-base"
                  placeholder="例如：支付宝"
                />
                <datalist id="account-options">
                  {ACCOUNT_OPTIONS.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="mb-2 block">日期</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, date: event.target.value }))
                  }
                  className="text-base"
                />
              </div>

              <div>
                <label className="mb-2 block">备注</label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, note: event.target.value }))
                  }
                  className="text-base"
                  placeholder="可选"
                />
              </div>

              {error ? (
                <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                className="w-full rounded-full px-4 py-3 text-base font-semibold"
              >
                {editing ? "保存修改" : "保存"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
