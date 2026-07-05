"use client";

import React, { useEffect, useState } from "react";
import { ModuleRepository, type Wallet } from "../services/ModuleRepository";

export function ModuleScreen() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [status, setStatus] = useState<"connecting" | "success" | "failure">("connecting");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function initNode() {
      try {
        const w = await ModuleRepository.getWallet();
        setWallet(w);
        setStatus("success");
        console.log("[FixIt Now Node Success]: Component attached directly to Supabase live server cluster.");
      } catch (e) {
        setStatus("failure");
        console.error("[FixIt Now Node Failure]: Connection exception or schema mismatch verified.", e);
      }
    }
    initNode();
  }, []);

  const handleTopUp = async () => {
    setBusy(true);
    try {
      const res = await ModuleRepository.fundEscrow(10);
      const w = await ModuleRepository.getWallet();
      setWallet(w);
      alert(`Successfully locked ${res.credited} OMR in node escrow!`);
    } catch {
      alert("Escrow mutation failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        background: "linear-gradient(180deg, #8DA9C4 0%, #EEF4F8 100%)",
        minHeight: "100vh",
        padding: "20px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <header
        style={{
          background: "#0B2545",
          color: "#FFFFFF",
          padding: "12px 18px",
          borderRadius: "10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <span style={{ fontSize: "16px", fontWeight: "800" }}>FixIt Now Escrow Node</span>
        <span
          style={{
            background: status === "success" ? "#10A875" : status === "failure" ? "#D9383A" : "#F1C40F",
            color: "#FFFFFF",
            padding: "4px 8px",
            borderRadius: "999px",
            fontSize: "11px",
            fontWeight: "bold",
          }}
        >
          {status === "success" && "● Node Live"}
          {status === "failure" && "● Node Down"}
          {status === "connecting" && "● Connecting..."}
        </span>
      </header>

      <main style={{ maxWidth: "500px", margin: "0 auto" }}>
        <div
          style={{
            background: "rgba(255, 255, 255, 0.75)",
            backdropFilter: "blur(20px)",
            borderRadius: "14px",
            padding: "20px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
          }}
        >
          <h2 style={{ color: "#0B2545", marginTop: 0, fontSize: "16px" }}>Escrow Balances</h2>
          {wallet ? (
            <div style={{ margin: "14px 0" }}>
              <div style={{ fontSize: "28px", fontWeight: "900", color: "#134074" }}>
                {wallet.balance.toFixed(3)} {wallet.currency}
              </div>
              <div style={{ fontSize: "12px", color: "gray", marginTop: 4 }}>
                Locked: {wallet.locked_balance.toFixed(3)} {wallet.currency}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: "12px", color: "gray", margin: "14px 0" }}>No wallet loaded.</div>
          )}
          <button
            style={{
              background: "#134074",
              color: "#FFFFFF",
              border: "none",
              padding: "10px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "bold",
              cursor: "pointer",
              width: "100%",
            }}
            onClick={handleTopUp}
            disabled={busy || status !== "success"}
          >
            {busy ? "Funding..." : "Quick Fund Escrow (10 OMR)"}
          </button>
        </div>
      </main>
    </div>
  );
}
