import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — HERR AGNES" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [validRecovery, setValidRecovery] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    async function validateRecoveryLink() {
      try {
        const url = new URL(window.location.href);
        const query = url.searchParams;
        const hash = new URLSearchParams(url.hash.replace(/^#/, ""));

        const authError =
          query.get("error_description") ||
          hash.get("error_description") ||
          query.get("error");
        if (authError) {
          throw new Error(decodeURIComponent(authError.replace(/\+/g, " ")));
        }

        // Supabase may return a PKCE code, a token_hash from the email
        // template, or an access/refresh token pair in the URL fragment.
        const code = query.get("code");
        const tokenHash = query.get("token_hash");
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        const recoveryType = query.get("type") || hash.get("type");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else if (tokenHash) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });
          if (verifyError) throw verifyError;
        } else if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
        } else if (recoveryType === "recovery") {
          throw new Error("O e-mail não trouxe um token de recuperação válido.");
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (!active) return;

        const isRecoverySession = Boolean(data.session) && !sessionError;
        setValidRecovery(isRecoverySession);
        if (!isRecoverySession) {
          setError("O link de redefinição é inválido ou expirou. Solicite um novo e-mail.");
        } else {
          // Remove one-time credentials from the address bar after establishing the session.
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (err) {
        if (!active) return;
        setValidRecovery(false);
        setError(err instanceof Error ? err.message : "Não foi possível validar o link. Solicite um novo e-mail de recuperação.");
      } finally {
        if (active) setChecking(false);
      }
    }

    void validateRecoveryLink();
    return () => {
      active = false;
    };
  }, []);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não são iguais.");
      return;
    }
    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setNotice("Sua senha foi redefinida. Agora você pode entrar no painel.");
      setValidRecovery(false);
      window.setTimeout(() => void navigate({ to: "/admin" }), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar a senha. Solicite um novo link.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f4ef] px-5 py-12 text-[#29231f]">
      <section className="w-full max-w-md rounded-xl border border-[#ded5c9] bg-white p-8 shadow-sm">
        <div className="mb-7 flex items-center gap-3">
          <div className="rounded-lg bg-[#2b211d] p-3 text-[#e3bd79]"><ShieldCheck size={24} /></div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#98733d]">HERR AGNES</p>
            <h1 className="font-display text-2xl">Redefinir senha</h1>
          </div>
        </div>
        {checking ? (
          <p className="text-sm text-[#6c6258]">Validando seu link de recuperação...</p>
        ) : validRecovery ? (
          <>
            <p className="mb-6 text-sm text-[#6c6258]">Crie uma nova senha para acessar o painel administrativo.</p>
            <form onSubmit={updatePassword} className="grid gap-4">
              <label className="grid gap-1.5 text-sm font-medium">Nova senha
                <input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-md border border-[#d8cec1] px-3 py-3 outline-none focus:border-[#98733d]" placeholder="Mínimo de 8 caracteres" />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">Confirme a nova senha
                <input type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="rounded-md border border-[#d8cec1] px-3 py-3 outline-none focus:border-[#98733d]" placeholder="Digite a senha novamente" />
              </label>
              {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              {notice && <p role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
              <button disabled={saving} className="mt-2 rounded-md bg-[#2b211d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#46362e] disabled:opacity-60">
                {saving ? "Salvando..." : "Salvar nova senha"}
              </button>
            </form>
          </>
        ) : (
          <div>
            <p className="mb-4 text-sm leading-6 text-[#6c6258]">{error || "Este link de recuperação não é mais válido."}</p>
            <Link to="/admin" className="inline-flex rounded-md bg-[#2b211d] px-4 py-3 text-sm font-semibold text-white hover:bg-[#46362e]">Voltar ao painel</Link>
          </div>
        )}
        {!validRecovery && notice && <p role="status" className="mt-3 rounded-md bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
        <p className="mt-6 text-center text-xs text-[#8a8076]">Área privada · HERR AGNES</p>
      </section>
    </main>
  );
}
