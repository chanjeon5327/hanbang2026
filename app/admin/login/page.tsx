"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  // 이미 인증된 경우 대시보드로 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/admin");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const success = await login(email, password);
    
    if (success) {
      router.push("/admin");
    } else {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
    
    setLoading(false);
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg-primary)",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--card-bg)",
          padding: "40px",
          borderRadius: "24px",
          border: "1px solid var(--border-color)",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "var(--text-primary)", marginBottom: "8px" }}>
            관리자 로그인
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>HANBANG Admin OS</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)", fontSize: "14px" }}>
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: `1px solid ${error ? "var(--up-color)" : "var(--border-color)"}`,
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-primary)",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)", fontSize: "14px" }}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: `1px solid ${error ? "var(--up-color)" : "var(--border-color)"}`,
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-primary)",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          {error && <p style={{ color: "var(--up-color)", fontSize: "12px" }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: loading ? "var(--text-muted)" : "var(--accent-color)",
              color: "white",
              fontWeight: "bold",
              fontSize: "16px",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            로그인
          </button>
        </form>
      </div>
    </div>
  );
}

