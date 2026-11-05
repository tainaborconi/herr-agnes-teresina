import { createFileRoute } from "@tanstack/react-router";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase-config";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { LogOut, RefreshCw, ShieldCheck, ClipboardList, Mail } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel administrativo — HERR AGNES" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type OrderStatus = "pending" | "in_progress" | "confirmed" | "cancelled";
type OrderItem = {
  id: string;
  product_name: string;
  keg_size: number;
  quantity: number;
  unit_price: number;
};
type Order = {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_reference: string;
  delivery_date: string;
  delivery_time: string;
  payment_method: string;
  payment_condition: string | null;
  notes: string | null;
  total: number;
  confirmed_total: number | null;
  status: OrderStatus;
  created_at: string;
  order_items: OrderItem[];
};
type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
};

const SUPABASE_KEY = SUPABASE_PUBLISHABLE_KEY;
const SESSION_KEY = "herr-agnes-admin-session";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Novo pedido",
  in_progress: "Em atendimento",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
};

function money(value: number | string | null | undefined) {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dateTime(date: string, time: string) {
  if (!date) return "Não informado";
  const [year, month, day] = date.slice(0, 10).split("-");
  return `${day}/${month}/${year}${time ? ` às ${String(time).slice(0, 5)}` : ""}`;
}

function AdminPage() {
  const configured = Boolean(SUPABASE_URL && SUPABASE_KEY);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [adminName, setAdminName] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sendingRecovery, setSendingRecovery] = useState(false);

  const headers = useMemo(
    () => ({
      apikey: SUPABASE_KEY ?? "",
      "Content-Type": "application/json",
    }),
    [],
  );

  async function loadOrders(accessToken: string) {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?select=*,order_items(*)&order=created_at.desc&limit=100`,
      { headers: { ...headers, Authorization: `Bearer ${accessToken}` } },
    );
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || "Não foi possível carregar os pedidos.");
    }
    setOrders((await response.json()) as Order[]);
  }

  async function refreshAuthSession(refreshToken: string): Promise<AuthSession> {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers,
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.access_token || !data.refresh_token) {
      throw new Error("Sua sessão expirou. Entre novamente.");
    }
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
    };
  }

  async function validateAdmin(accessToken: string) {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { ...headers, Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) throw new Error("Sua sessão expirou. Entre novamente.");
    const user = (await response.json()) as { id: string; email?: string };
    const profileResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`,
      { headers: { ...headers, Authorization: `Bearer ${accessToken}` } },
    );
    if (!profileResponse.ok) throw new Error("Não foi possível validar seu acesso.");
    const profiles = (await profileResponse.json()) as { role: string }[];
    if (!profiles.some((profile) => profile.role === "admin")) {
      throw new Error("Este usuário não tem permissão de administrador.");
    }
    setAdminName(user.email || "Administrador");
    await loadOrders(accessToken);
  }

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      if (!configured) {
        setChecking(false);
        return;
      }
      try {
        const saved = sessionStorage.getItem(SESSION_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as AuthSession;
          if (parsed.access_token && parsed.refresh_token) {
            let restored = parsed;
            try {
              await validateAdmin(restored.access_token);
            } catch {
              restored = await refreshAuthSession(parsed.refresh_token);
              await validateAdmin(restored.access_token);
            }
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(restored));
            if (active) setSession(restored);
          }
        }
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      } finally {
        if (active) setChecking(false);
      }
    }
    void restoreSession();
    return () => {
      active = false;
    };
  }, [configured]);

  useEffect(() => {
    if (!session) return;
    const intervalId = window.setInterval(() => {
      void refreshAuthSession(session.refresh_token)
        .then(async (refreshed) => {
          await validateAdmin(refreshed.access_token);
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(refreshed));
          setSession(refreshed);
        })
        .catch(() => {
          sessionStorage.removeItem(SESSION_KEY);
          setSession(null);
          setOrders([]);
          setError("Sua sessão expirou. Entre novamente.");
        });
    }, 50 * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, [session]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers,
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || data.message || "E-mail ou senha inválidos.");
      const nextSession: AuthSession = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
      };
      await validateAdmin(nextSession.access_token);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  async function sendPasswordRecovery() {
    if (!email.trim()) {
      setError("Informe seu e-mail para receber o link de redefinição.");
      return;
    }
    setSendingRecovery(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: email.trim(),
          redirect_to: `${window.location.origin}/reset-password`,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.msg || body.message || "Não foi possível enviar o e-mail de recuperação.");
      }
      setNotice("Se esse e-mail estiver cadastrado, você receberá um link para redefinir a senha.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível solicitar a redefinição.");
    } finally {
      setSendingRecovery(false);
    }
  }

  async function signOut() {
    if (session) {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: "POST",
        headers: { ...headers, Authorization: `Bearer ${session.access_token}` },
      }).catch(() => undefined);
    }
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
    setOrders([]);
    setAdminName("");
    setNotice("");
  }

  async function refreshOrders() {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      await loadOrders(session.access_token);
      setNotice("Lista de pedidos atualizada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar os pedidos.");
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(order: Order, status: OrderStatus) {
    if (!session) return;
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`,
        {
          method: "PATCH",
          headers: {
            ...headers,
            Authorization: `Bearer ${session.access_token}`,
            Prefer: "return=representation",
          },
          body: JSON.stringify({ status }),
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || "Não foi possível atualizar o status.");
      }
      const updated = (await response.json()) as Order[];
      const updatedOrder = updated[0];
      if (updatedOrder) {
        setOrders((current) => current.map((item) => item.id === order.id ? { ...item, status: updatedOrder.status } : item));
      }
      setNotice(`Pedido #${order.order_number}: ${STATUS_LABEL[status].toLowerCase()}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar o pedido.");
    }
  }

  const visibleOrders = filter === "all" ? orders : orders.filter((order) => order.status === filter);
  const pendingCount = orders.filter((order) => order.status === "pending").length;

  if (!configured) {
    return (
      <main className="min-h-screen bg-[#f7f4ef] px-5 py-16 text-[#29231f]">
        <div className="mx-auto max-w-xl rounded-xl border border-[#ded5c9] bg-white p-8 shadow-sm">
          <ShieldCheck className="mb-4 text-[#98733d]" size={32} />
          <h1 className="font-display text-2xl">Painel HERR AGNES</h1>
          <p className="mt-3 text-sm leading-6 text-[#6c6258]">
            A conexão com o Supabase ainda não está configurada neste ambiente. O painel não fará consultas até que as variáveis públicas do projeto estejam disponíveis.
          </p>
        </div>
      </main>
    );
  }

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f7f4ef] text-sm text-[#6c6258]">Verificando acesso ao painel...</div>;
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f4ef] px-5 py-12 text-[#29231f]">
        <section className="w-full max-w-md rounded-xl border border-[#ded5c9] bg-white p-8 shadow-sm">
          <div className="mb-7 flex items-center gap-3">
            <div className="rounded-lg bg-[#2b211d] p-3 text-[#e3bd79]"><ShieldCheck size={24} /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#98733d]">HERR AGNES</p>
              <h1 className="font-display text-2xl">Painel administrativo</h1>
            </div>
          </div>
          <p className="mb-6 text-sm text-[#6c6258]">Entre com seu usuário autorizado para consultar e gerenciar os pedidos.</p>
          <form onSubmit={signIn} className="grid gap-4">
            <label className="grid gap-1.5 text-sm font-medium">E-mail
              <input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-md border border-[#d8cec1] px-3 py-3 outline-none focus:border-[#98733d]" placeholder="seu@email.com" />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">Senha
              <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-md border border-[#d8cec1] px-3 py-3 outline-none focus:border-[#98733d]" placeholder="Sua senha" />
            </label>
            {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {notice && <p role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
            <button disabled={loading} className="mt-2 rounded-md bg-[#2b211d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#46362e] disabled:opacity-60">
              {loading ? "Verificando..." : "Entrar no painel"}
            </button>
          </form>
          <button type="button" onClick={() => void sendPasswordRecovery()} disabled={sendingRecovery} className="mt-3 inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-[#98733d] hover:underline disabled:opacity-60"><Mail size={16} /> {sendingRecovery ? "Enviando link..." : "Esqueci minha senha"}</button>
          <p className="mt-6 text-center text-xs text-[#8a8076]">Acesso restrito à equipe autorizada.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ef] px-4 py-8 text-[#29231f] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#98733d]">HERR AGNES · ADMINISTRAÇÃO</p>
            <h1 className="mt-1 font-display text-3xl">Pedidos recebidos</h1>
            <p className="mt-1 text-sm text-[#6c6258]">Olá, {adminName}. Você tem {pendingCount} pedido(s) aguardando atendimento.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={refreshOrders} disabled={loading} className="inline-flex items-center gap-2 rounded-md border border-[#d8cec1] bg-white px-3 py-2 text-sm font-medium hover:bg-[#f2ece4] disabled:opacity-60"><RefreshCw size={16} /> Atualizar</button>
            <button onClick={signOut} className="inline-flex items-center gap-2 rounded-md bg-[#2b211d] px-3 py-2 text-sm font-medium text-white hover:bg-[#46362e]"><LogOut size={16} /> Sair</button>
          </div>
        </header>

        {error && <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800">{notice}</p>}

        <section className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-[#e1d8cc] bg-white p-4"><p className="text-xs text-[#766b60]">Total de pedidos</p><p className="mt-1 text-2xl font-semibold">{orders.length}</p></div>
          <div className="rounded-lg border border-[#e1d8cc] bg-white p-4"><p className="text-xs text-[#766b60]">Novos</p><p className="mt-1 text-2xl font-semibold">{pendingCount}</p></div>
          <div className="rounded-lg border border-[#e1d8cc] bg-white p-4"><p className="text-xs text-[#766b60]">Em atendimento</p><p className="mt-1 text-2xl font-semibold">{orders.filter((order) => order.status === "in_progress").length}</p></div>
          <div className="rounded-lg border border-[#e1d8cc] bg-white p-4"><p className="text-xs text-[#766b60]">Confirmados</p><p className="mt-1 text-2xl font-semibold">{orders.filter((order) => order.status === "confirmed").length}</p></div>
        </section>

        <section className="overflow-hidden rounded-lg border border-[#e1d8cc] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee7de] p-4">
            <div className="flex items-center gap-2"><ClipboardList size={18} className="text-[#98733d]" /><h2 className="font-semibold">Lista de pedidos</h2></div>
            <select aria-label="Filtrar pedidos por status" value={filter} onChange={(event) => setFilter(event.target.value as "all" | OrderStatus)} className="rounded-md border border-[#d8cec1] bg-white px-3 py-2 text-sm">
              <option value="all">Todos os status</option>
              <option value="pending">Novos</option>
              <option value="in_progress">Em atendimento</option>
              <option value="confirmed">Confirmados</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>
          {visibleOrders.length === 0 ? (
            <div className="p-12 text-center text-sm text-[#766b60]">Nenhum pedido encontrado para este filtro.</div>
          ) : (
            <div className="divide-y divide-[#eee7de]">
              {visibleOrders.map((order) => (
                <article key={order.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#98733d]">Pedido #{order.order_number}</p>
                      <h3 className="mt-1 text-lg font-semibold">{order.customer_name}</h3>
                      <p className="text-sm text-[#766b60]">{order.customer_phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{money(order.total)}</p>
                      <p className="text-xs text-[#766b60]">Criado em {new Date(order.created_at).toLocaleString("pt-BR")}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <div><p className="text-xs text-[#8a8076]">Entrega</p><p>{dateTime(order.delivery_date, order.delivery_time)}</p></div>
                    <div><p className="text-xs text-[#8a8076]">Endereço</p><p>{order.delivery_address}</p>{order.delivery_reference && <p className="text-xs text-[#766b60]">Referência: {order.delivery_reference}</p>}</div>
                    <div><p className="text-xs text-[#8a8076]">Pagamento</p><p>{order.payment_method}{order.payment_condition ? ` · ${order.payment_condition}` : ""}</p></div>
                  </div>
                  <div className="mt-4 rounded-md bg-[#faf8f5] p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8a8076]">Itens</p>
                    {order.order_items?.length ? order.order_items.map((item) => (
                      <p key={item.id} className="text-sm">{item.quantity} × {item.product_name} · Barril {item.keg_size}L — {money(item.unit_price)} cada</p>
                    )) : <p className="text-sm text-[#766b60]">Itens não disponíveis neste pedido.</p>}
                    {order.notes && <p className="mt-2 text-sm"><strong>Observações:</strong> {order.notes}</p>}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full bg-[#f2ece4] px-3 py-1 text-xs font-medium">{STATUS_LABEL[order.status]}</span>
                    <label className="flex items-center gap-2 text-sm">Atualizar status
                      <select value={order.status} onChange={(event) => void changeStatus(order, event.target.value as OrderStatus)} className="rounded-md border border-[#d8cec1] bg-white px-3 py-2">
                        {Object.entries(STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        <p className="mt-5 text-center text-xs text-[#8a8076]">Área privada · Os dados são exibidos conforme as permissões do Supabase.</p>
      </div>
    </main>
  );
}
