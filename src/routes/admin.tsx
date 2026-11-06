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
  const [changingEmail, setChangingEmail] = useState(false);
  const [activeTab, setActiveTab] = useState<"crm" | "meta">("crm");
  const [draggingOrderId, setDraggingOrderId] = useState<string | null>(null);

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
      const redirectTo = `${window.location.origin}/reset-password`;
      const response = await fetch(
        `${SUPABASE_URL}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ email: email.trim() }),
        },
      );
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

  async function changeAdminEmail() {
    if (!session) return;
    const confirmed = window.confirm(
      "Deseja alterar o e-mail de acesso do painel para tainalimaborconi@gmail.com? Sua senha atual será mantida."
    );
    if (!confirmed) return;

    setChangingEmail(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-change-email`, {
        method: "POST",
        headers: {
          ...headers,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Não foi possível alterar o e-mail.");
      }
      setAdminName(result.email || "tainalimaborconi@gmail.com");
      setNotice("E-mail de acesso atualizado para tainalimaborconi@gmail.com. Sua senha continua a mesma.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível alterar o e-mail.");
    } finally {
      setChangingEmail(false);
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

  const columns: { status: OrderStatus; title: string; hint: string; accent: string }[] = [
    { status: "pending", title: "Novos pedidos", hint: "Aguardando primeiro contato", accent: "border-t-[#b98a42]" },
    { status: "in_progress", title: "Em atendimento", hint: "Em conversa com o cliente", accent: "border-t-[#71869a]" },
    { status: "confirmed", title: "Confirmados", hint: "Vendas concluídas", accent: "border-t-[#66856b]" },
    { status: "cancelled", title: "Cancelados", hint: "Pedidos que não avançaram", accent: "border-t-[#b47770]" },
  ];
  const confirmedRevenue = orders.filter((order) => order.status === "confirmed")
    .reduce((sum, order) => sum + Number(order.confirmed_total ?? order.total ?? 0), 0);
  const moveDraggedOrder = (status: OrderStatus) => {
    if (!draggingOrderId) return;
    const order = orders.find((item) => item.id === draggingOrderId);
    if (order && order.status !== status) void changeStatus(order, status);
    setDraggingOrderId(null);
  };

  return (
    <main className="min-h-screen bg-[#f6f4f0] px-4 py-7 text-[#29231f] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#98733d]">HERR AGNES · ADMINISTRAÇÃO</p>
            <h1 className="mt-1 font-display text-3xl">Central comercial</h1>
            <p className="mt-1 text-sm text-[#6c6258]">Olá, {adminName}. Você tem {pendingCount} pedido(s) aguardando atendimento.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void changeAdminEmail()} disabled={changingEmail} className="inline-flex items-center gap-2 rounded-md border border-[#d8cec1] bg-white px-3 py-2 text-sm font-medium hover:bg-[#f2ece4] disabled:opacity-60"><Mail size={16} /> {changingEmail ? "Alterando..." : "Alterar e-mail"}</button>
            <button onClick={refreshOrders} disabled={loading} className="inline-flex items-center gap-2 rounded-md border border-[#d8cec1] bg-white px-3 py-2 text-sm font-medium hover:bg-[#f2ece4] disabled:opacity-60"><RefreshCw size={16} /> Atualizar</button>
            <button onClick={signOut} className="inline-flex items-center gap-2 rounded-md bg-[#2b211d] px-3 py-2 text-sm font-medium text-white hover:bg-[#46362e]"><LogOut size={16} /> Sair</button>
          </div>
        </header>
        {error && <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800">{notice}</p>}

        <nav className="mb-6 flex gap-2 border-b border-[#ded7ce]">
          <button onClick={() => setActiveTab("crm")} className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${activeTab === "crm" ? "border-[#98733d] text-[#2b211d]" : "border-transparent text-[#81766b] hover:text-[#2b211d]"}`}>CRM · Pedidos</button>
          <button onClick={() => setActiveTab("meta")} className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${activeTab === "meta" ? "border-[#98733d] text-[#2b211d]" : "border-transparent text-[#81766b] hover:text-[#2b211d]"}`}>Meta Ads · Resultados</button>
        </nav>

        {activeTab === "crm" ? (
          <>
            <section className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-5">
              <div className="rounded-xl border border-[#e4ddd3] bg-white p-4"><p className="text-xs text-[#766b60]">Total de pedidos</p><p className="mt-1 text-2xl font-semibold">{orders.length}</p><p className="mt-1 text-[11px] text-[#9a9086]">Pedidos recebidos</p></div>
              <div className="rounded-xl border border-[#e4ddd3] bg-white p-4"><p className="text-xs text-[#766b60]">Novos</p><p className="mt-1 text-2xl font-semibold">{pendingCount}</p><p className="mt-1 text-[11px] text-[#9a9086]">Precisam de contato</p></div>
              <div className="rounded-xl border border-[#e4ddd3] bg-white p-4"><p className="text-xs text-[#766b60]">Em atendimento</p><p className="mt-1 text-2xl font-semibold">{orders.filter((order) => order.status === "in_progress").length}</p><p className="mt-1 text-[11px] text-[#9a9086]">Em negociação</p></div>
              <div className="rounded-xl border border-[#e4ddd3] bg-white p-4"><p className="text-xs text-[#766b60]">Confirmados</p><p className="mt-1 text-2xl font-semibold">{orders.filter((order) => order.status === "confirmed").length}</p><p className="mt-1 text-[11px] text-[#9a9086]">Vendas concluídas</p></div>
              <div className="col-span-2 rounded-xl border border-[#e4ddd3] bg-white p-4 xl:col-span-1"><p className="text-xs text-[#766b60]">Valor confirmado</p><p className="mt-1 text-2xl font-semibold">{money(confirmedRevenue)}</p><p className="mt-1 text-[11px] text-[#9a9086]">Soma dos pedidos confirmados</p></div>
            </section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div><h2 className="text-lg font-semibold">Pipeline de vendas</h2><p className="text-sm text-[#81766b]">Arraste os cartões entre as etapas para atualizar o andamento.</p></div>
              <span className="text-xs text-[#81766b]">{orders.length} pedido(s) no painel</span>
            </div>
            <section className="grid items-start gap-4 md:grid-cols-2 2xl:grid-cols-4">
              {columns.map((column) => {
                const columnOrders = orders.filter((order) => order.status === column.status);
                const columnTotal = columnOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
                return (
                  <div key={column.status} onDragOver={(event) => event.preventDefault()} onDrop={() => moveDraggedOrder(column.status)} className={`min-h-[260px] rounded-xl border border-[#e4ddd3] border-t-4 bg-[#eeece8] p-3 ${column.accent}`}>
                    <div className="mb-3 flex items-start justify-between gap-2 px-1">
                      <div><h3 className="text-sm font-semibold">{column.title}</h3><p className="mt-0.5 text-[11px] text-[#81766b]">{column.hint}</p></div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold">{columnOrders.length}</span>
                    </div>
                    <p className="mb-3 px-1 text-xs text-[#81766b]">{money(columnTotal)} em pedidos</p>
                    <div className="grid gap-3">
                      {columnOrders.map((order) => (
                        <article key={order.id} draggable onDragStart={() => setDraggingOrderId(order.id)} onDragEnd={() => setDraggingOrderId(null)} className={`cursor-grab rounded-lg border border-[#e6dfd6] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing ${draggingOrderId === order.id ? "opacity-50" : ""}`}>
                          <div className="flex items-start justify-between gap-2"><span className="text-[11px] font-semibold uppercase tracking-wider text-[#98733d]">Pedido #{order.order_number}</span><span className="text-sm font-semibold">{money(order.confirmed_total ?? order.total)}</span></div>
                          <h4 className="mt-2 font-semibold leading-snug">{order.customer_name}</h4>
                          <p className="mt-0.5 text-xs text-[#81766b]">{order.customer_phone}</p>
                          <div className="mt-3 space-y-1.5 border-t border-[#f0ebe5] pt-3 text-xs text-[#5f574f]">
                            <p><span className="font-medium">Entrega:</span> {dateTime(order.delivery_date, order.delivery_time)}</p>
                            <p><span className="font-medium">Pagamento:</span> {order.payment_method}</p>
                            <p><span className="font-medium">Itens:</span> {order.order_items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) ?? 0} unidade(s)</p>
                          </div>
                          {order.order_items?.length > 0 && <div className="mt-2 rounded-md bg-[#faf8f5] p-2 text-xs text-[#6c6258]">{order.order_items.map((item) => <p key={item.id}>{item.quantity} × {item.product_name} · {item.keg_size}L</p>)}</div>}
                          {order.notes && <p className="mt-2 line-clamp-2 text-xs italic text-[#81766b]">“{order.notes}”</p>}
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <a href={`https://wa.me/${order.customer_phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md bg-[#edf5ed] px-2.5 py-2 text-xs font-semibold text-[#356b43] hover:bg-[#e0eee1]">WhatsApp <span aria-hidden="true">↗</span></a>
                            <select aria-label={`Alterar etapa do pedido ${order.order_number}`} value={order.status} onChange={(event) => void changeStatus(order, event.target.value as OrderStatus)} className="max-w-[145px] rounded-md border border-[#ded7ce] bg-white px-2 py-2 text-xs">
                              {Object.entries(STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                            </select>
                          </div>
                        </article>
                      ))}
                      {columnOrders.length === 0 && <div className="rounded-lg border border-dashed border-[#d5cdc2] px-3 py-8 text-center text-xs text-[#9a9086]">Nenhum pedido nesta etapa</div>}
                    </div>
                  </div>
                );
              })}
            </section>
          </>
        ) : (
          <section className="space-y-5">
            <div><h2 className="text-lg font-semibold">Desempenho das campanhas</h2><p className="text-sm text-[#81766b]">Acompanhe investimento, receita atribuída e retorno dos anúncios que direcionam para o site.</p></div>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { label: "Investimento no Meta", detail: "Total gasto no período" },
                { label: "Valor de conversão", detail: "Receita atribuída às campanhas" },
                { label: "ROAS", detail: "Receita atribuída ÷ investimento" },
              ].map((metric) => <div key={metric.label} className="rounded-xl border border-[#e4ddd3] bg-white p-5"><p className="text-xs text-[#766b60]">{metric.label}</p><p className="mt-3 text-3xl font-semibold text-[#8c8379]">—</p><p className="mt-1 text-xs text-[#9a9086]">{metric.detail}</p></div>)}
            </div>
            <div className="rounded-xl border border-[#e4ddd3] bg-white p-6">
              <div className="flex items-center gap-3"><div className="rounded-lg bg-[#f2ece4] p-3 text-[#98733d]"><ClipboardList size={22} /></div><div><h3 className="font-semibold">Integração com Meta Ads pendente</h3><p className="text-sm text-[#81766b]">O painel visual já está preparado, mas ainda não está conectado à conta de anúncios.</p></div></div>
              <div className="mt-5 grid gap-4 border-t border-[#eee7de] pt-5 md:grid-cols-2">
                <div><p className="text-sm font-semibold">Dados que serão exibidos</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#6c6258]"><li>Investimento por campanha e por período</li><li>Compras/conversões atribuídas e valor de conversão</li><li>ROAS geral e por campanha</li><li>Pedidos do site confirmados no CRM</li></ul></div>
                <div><p className="text-sm font-semibold">Conexão segura</p><p className="mt-2 text-sm leading-6 text-[#6c6258]">A integração será feita pela API oficial da Meta, com credenciais guardadas nos secrets do Supabase — nunca no código público do site. Assim os dados poderão ser atualizados sem expor tokens no navegador.</p></div>
              </div>
            </div>
            <div className="rounded-lg border border-dashed border-[#d8cec1] bg-[#faf8f5] p-4 text-sm text-[#766b60]">Os indicadores aparecem como “—” até a conexão ser configurada. Nenhum investimento ou resultado estimado será exibido como se fosse dado real.</div>
          </section>
        )}
        <p className="mt-7 text-center text-xs text-[#8a8076]">Área privada · Dados protegidos pelas permissões do Supabase.</p>
      </div>
    </main>
  );
}
