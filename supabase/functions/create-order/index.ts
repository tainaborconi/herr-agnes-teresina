const corsHeaders = {
  "Access-Control-Allow-Origin": "https://www.herragnesteresina.com.br",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

const catalog: Record<string, { p30: number; p50: number }> = {
  "Pilsen": { p30: 499, p50: 779 },
  "Puro Malte": { p30: 565, p50: 889 },
  "Agnes 08 Zero Glúten": { p30: 575, p50: 899 },
  "IPA": { p30: 669, p50: 1099 },
  "Munich": { p30: 649, p50: 1059 },
  "Red Wein (Chopp de Vinho)": { p30: 669, p50: 1099 },
};

type OrderInput = {
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_reference: string;
  delivery_date: string;
  delivery_time: string;
  payment_method: string;
  payment_condition?: string | null;
  notes?: string | null;
  coupon_code?: string | null;
  items: Array<{ product_name: string; keg_size: number; quantity: number }>;
  turnstile_token?: string;
  fbp?: string | null;
  fbc?: string | null;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);

  const origin = request.headers.get("origin");
  if (origin !== "https://www.herragnesteresina.com.br") {
    return json({ error: "Origem não autorizada." }, 403);
  }

  // Fail closed until Cloudflare Turnstile is configured for the public order form.
  const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!turnstileSecret) {
    return json({ error: "A proteção de segurança do formulário ainda está sendo configurada. Entre em contato pelo WhatsApp." }, 503);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    console.error("Missing Supabase server environment variables.");
    return json({ error: "Serviço temporariamente indisponível." }, 500);
  }

  let input: OrderInput;
  try {
    const raw = await request.json();
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return json({ error: "Dados do pedido inválidos." }, 400);
    }
    input = raw as OrderInput;
  } catch {
    return json({ error: "Não foi possível ler os dados do pedido." }, 400);
  }

  const required = [
    input.customer_name, input.customer_phone, input.delivery_address,
    input.delivery_reference, input.delivery_date, input.delivery_time,
    input.payment_method,
  ];
  if (required.some((value) => typeof value !== "string" || !value.trim())) {
    return json({ error: "Preencha todos os campos obrigatórios." }, 400);
  }
  if (input.customer_name.trim().length > 120 ||
      input.customer_phone.replace(/\D/g, "").length < 10 ||
      input.customer_phone.replace(/\D/g, "").length > 13 ||
      input.delivery_address.trim().length > 300 ||
      input.delivery_reference.trim().length > 200 ||
      (input.notes ?? "").length > 1000) {
    return json({ error: "Confira os dados informados." }, 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.delivery_date) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.delivery_time)) {
    return json({ error: "Data ou horário inválido." }, 400);
  }
  if (!["Pix", "Cartão de crédito", "Cartão de débito"].includes(input.payment_method)) {
    return json({ error: "Forma de pagamento inválida." }, 400);
  }

  if (!input.turnstile_token || input.turnstile_token.length > 2048) {
    return json({ error: "Confirme a verificação de segurança." }, 400);
  }
  const verificationBody = new URLSearchParams({
    secret: turnstileSecret,
    response: input.turnstile_token,
  });
  const verificationResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: verificationBody,
  });
  const verification = await verificationResponse.json().catch(() => ({ success: false }));
  if (!verificationResponse.ok || verification.success !== true ||
      verification.hostname !== "www.herragnesteresina.com.br" || verification.action !== "order") {
    return json({ error: "A verificação de segurança falhou. Atualize a página e tente novamente." }, 403);
  }
  const paymentCondition = input.payment_method === "Cartão de crédito"
    ? (input.payment_condition === "Até 3x" ? "Até 3x" : "Crédito à vista")
    : null;
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 8) {
    return json({ error: "Confira os itens do pedido." }, 400);
  }

  const items = [];
  let total = 0;
  for (const item of input.items) {
    const product = catalog[item.product_name];
    if (!product || ![30, 50].includes(item.keg_size) ||
        !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
      return json({ error: "Um dos produtos do pedido é inválido." }, 400);
    }
    const unitPrice = item.keg_size === 30 ? product.p30 : product.p50;
    total += unitPrice * item.quantity;
    items.push({
      product_name: item.product_name,
      keg_size: item.keg_size,
      quantity: item.quantity,
      unit_price: unitPrice,
    });
  }

  const couponCode = (input.coupon_code ?? "").trim().toUpperCase();
  if (couponCode && couponCode !== "AGNES10") {
    return json({ error: "Cupom inválido. Confira o código e tente novamente." }, 400);
  }
  const subtotal = total;
  const discountPercent = couponCode === "AGNES10" ? 10 : 0;
  const discountAmount = Math.round(subtotal * discountPercent) / 100;
  total = Math.max(0, subtotal - discountAmount);

  const couponCode = (input.coupon_code ?? "").trim().toUpperCase();
  if (couponCode && couponCode !== "AGNES10") {
    return json({ error: "Cupom inválido. Confira o código e tente novamente." }, 400);
  }
  const subtotal = total;
  const discountPercent = couponCode === "AGNES10" ? 10 : 0;
  const discountAmount = Math.round(subtotal * discountPercent) / 100;
  total = Math.max(0, subtotal - discountAmount);

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };
  const orderResponse = await fetch(`${supabaseUrl}/rest/v1/orders?select=id,order_number,total`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify({
      customer_name: input.customer_name.trim(),
      customer_phone: input.customer_phone.trim(),
      delivery_address: input.delivery_address.trim(),
      delivery_reference: input.delivery_reference.trim(),
      delivery_date: input.delivery_date,
      delivery_time: input.delivery_time,
      payment_method: input.payment_method,
      payment_condition: paymentCondition,
      notes: (input.notes ?? "").trim() || null,
      coupon_code: couponCode || null,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      fbp: typeof input.fbp === "string" ? input.fbp.slice(0, 255) : null,
      fbc: typeof input.fbc === "string" ? input.fbc.slice(0, 500) : null,
      total,
    }),
  });
  if (!orderResponse.ok) {
    console.error("Order insert failed:", await orderResponse.text());
    return json({ error: "Não foi possível registrar seu pedido. Tente novamente." }, 502);
  }

  const [order] = await orderResponse.json();
  const itemsResponse = await fetch(`${supabaseUrl}/rest/v1/order_items`, {
    method: "POST",
    headers,
    body: JSON.stringify(items.map((item) => ({ ...item, order_id: order.id }))),
  });
  if (!itemsResponse.ok) {
    console.error("Order items insert failed:", await itemsResponse.text());
    await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${order.id}`, {
      method: "DELETE",
      headers,
    });
    return json({ error: "Não foi possível concluir o registro do pedido. Tente novamente." }, 502);
  }


  // Notify both administrators after the order and its items are safely stored.
  // Email failures must never undo or block a successful customer order.
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (resendApiKey) {
    const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[char] ?? char);
    const money = (value: number) => new Intl.NumberFormat("pt-BR", {
      style: "currency", currency: "BRL",
    }).format(value);
    const itemRows = items.map((item) =>
      `<tr><td style="padding:10px;border-bottom:1px solid #eee;">${escapeHtml(item.product_name)}</td><td style="padding:10px;border-bottom:1px solid #eee;">${item.keg_size} L</td><td style="padding:10px;border-bottom:1px solid #eee;">${item.quantity}</td><td style="padding:10px;border-bottom:1px solid #eee;">${money(item.unit_price * item.quantity)}</td></tr>`
    ).join("");
    const subject = `Novo pedido #${order.order_number} - Herr Agnes`;
    const html = `
      <div style="font-family:Arial,sans-serif;color:#222;max-width:680px;margin:0 auto;">
        <h2 style="margin-bottom:4px;">Novo pedido recebido 🍻</h2>
        <p style="color:#666;margin-top:0;">Pedido #${escapeHtml(order.order_number)} registrado no site Herr Agnes.</p>
        <h3>Dados do cliente</h3>
        <p><strong>Nome:</strong> ${escapeHtml(input.customer_name)}<br>
        <strong>Telefone:</strong> ${escapeHtml(input.customer_phone)}<br>
        <strong>Endereço:</strong> ${escapeHtml(input.delivery_address)}<br>
        <strong>Referência:</strong> ${escapeHtml(input.delivery_reference)}</p>
        <h3>Entrega e pagamento</h3>
        <p><strong>Data:</strong> ${escapeHtml(input.delivery_date)}<br>
        <strong>Horário:</strong> ${escapeHtml(input.delivery_time)}<br>
        <strong>Pagamento:</strong> ${escapeHtml(input.payment_method)}${paymentCondition ? ` (${escapeHtml(paymentCondition)})` : ""}</p>
        <h3>Itens do pedido</h3>
        <table style="width:100%;border-collapse:collapse;text-align:left;">
          <thead><tr><th style="padding:10px;border-bottom:2px solid #ddd;">Produto</th><th style="padding:10px;border-bottom:2px solid #ddd;">Barril</th><th style="padding:10px;border-bottom:2px solid #ddd;">Qtd.</th><th style="padding:10px;border-bottom:2px solid #ddd;">Subtotal</th></tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        ${discountPercent ? `<p style="text-align:right;color:#16733c;">Cupom ${escapeHtml(couponCode)} (${discountPercent}%): -${money(discountAmount)}</p>` : ""}
        ${discountPercent ? `<p style="text-align:right;color:#16733c;">Cupom ${escapeHtml(couponCode)} (${discountPercent}%): -${money(discountAmount)}</p>` : ""}
        <h3 style="text-align:right;">Total: ${money(Number(order.total ?? total))}</h3>
        ${input.notes?.trim() ? `<p><strong>Observações:</strong> ${escapeHtml(input.notes.trim())}</p>` : ""}
        <p style="color:#888;font-size:12px;margin-top:28px;">Notificação automática do site Herr Agnes.</p>
      </div>`;
    const textBody = [
      `Novo pedido #${order.order_number} - Herr Agnes`,
      `Cliente: ${input.customer_name}`,
      `Telefone: ${input.customer_phone}`,
      `Endereço: ${input.delivery_address}`,
      `Referência: ${input.delivery_reference}`,
      `Entrega: ${input.delivery_date} às ${input.delivery_time}`,
      `Pagamento: ${input.payment_method}${paymentCondition ? ` (${paymentCondition})` : ""}`,
      "Itens:",
      ...items.map((item) => `- ${item.product_name}, barril ${item.keg_size}L, quantidade ${item.quantity}, subtotal ${money(item.unit_price * item.quantity)}`),
      ...(discountPercent ? [`Cupom ${couponCode} (${discountPercent}%): -${money(discountAmount)}`] : []),
      ...(discountPercent ? [`Cupom ${couponCode} (${discountPercent}%): -${money(discountAmount)}`] : []),
      `Total: ${money(Number(order.total ?? total))}`,
      input.notes?.trim() ? `Observações: ${input.notes.trim()}` : "",
    ].filter(Boolean).join("\\n");
    try {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Herr Agnes Pedidos <pedidos@herragnesteresina.com.br>",
          to: ["agnesteresina@gmail.com", "tainalimaborconi@gmail.com"],
          subject,
          html,
          text: textBody,
        }),
      });
      if (!emailResponse.ok) {
        console.error("Order notification email failed:", await emailResponse.text());
      }
    } catch (emailError) {
      console.error("Order notification email request failed:", emailError);
    }
  } else {
    console.error("RESEND_API_KEY is not configured; order notification email was skipped.");
  }

  return json({ order_number: order.order_number, subtotal, discount_percent: discountPercent, discount_amount: discountAmount, total: order.total });
});
